import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";
import {
  ALLOWED_CONTENT_TYPES,
  MAX_UPLOAD_SIZE,
  buildFilename,
  detectMediaType,
  getUploadValidationError,
  isAllowedUploadPathname,
} from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function getBlobToken(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return null;

  if (
    token === "vercel_blob_read_write_token" ||
    token === "your_vercel_blob_token"
  ) {
    return null;
  }

  return token;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Unknown upload error";
}

async function uploadToBlob(
  filename: string,
  buffer: Buffer,
  contentType?: string,
  token?: string
) {
  return put(filename, buffer, {
    access: "public",
    addRandomSuffix: false,
    contentType,
    ...(token ? { token } : {}),
  });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
    const blobToken = getBlobToken();

    if (contentType.includes("application/json")) {
      const body = (await req.json()) as HandleUploadBody;

      const response = await handleUpload({
        body,
        request: req,
        ...(blobToken ? { token: blobToken } : {}),
        onBeforeGenerateToken: async (pathname) => {
          const session = await getSession();
          if (!session) {
            throw new Error("Unauthorized");
          }

          if (!isAllowedUploadPathname(pathname, session.userId)) {
            throw new Error("Invalid upload pathname");
          }

          return {
            allowedContentTypes: [...ALLOWED_CONTENT_TYPES],
            maximumSizeInBytes: MAX_UPLOAD_SIZE,
            addRandomSuffix: false,
          };
        },
        onUploadCompleted: async () => {
          // The post record is created after the client receives the blob URL.
        },
      });

      return NextResponse.json(response);
    }

    const session = await getSession();
    if (!session) return apiError("Unauthorized", 401);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return apiError("No file provided", 400);

    const validationError = getUploadValidationError(file);
    if (validationError) return apiError(validationError, 400);

    const mediaType = detectMediaType(file);
    const filename = buildFilename(session.userId, file.name, mediaType);
    const buffer = Buffer.from(await file.arrayBuffer());

    if (blobToken || IS_PRODUCTION) {
      const attempts: Array<{ label: string; token?: string }> = IS_PRODUCTION
        ? [
            { label: "project-connected Blob store" },
            ...(blobToken ? [{ label: "explicit Blob token", token: blobToken }] : []),
          ]
        : blobToken
          ? [{ label: "explicit Blob token", token: blobToken }]
          : [];

      const errors: string[] = [];

      for (const attempt of attempts) {
        try {
          const blob = await uploadToBlob(
            filename,
            buffer,
            file.type || undefined,
            attempt.token
          );

          return apiSuccess(
            {
              url: blob.url,
              mediaType,
            },
            201
          );
        } catch (error) {
          const message = getErrorMessage(error);
          console.error(`Blob upload failed via ${attempt.label}:`, error);
          errors.push(`${attempt.label}: ${message}`);
        }
      }

      if (IS_PRODUCTION && errors.length > 0) {
        return apiError(`Cloud upload failed: ${errors.join(" | ")}`, 500);
      }
    }

    if (IS_PRODUCTION) {
      return apiError(
        "File uploads are not configured for production. Add BLOB_READ_WRITE_TOKEN to your deployment environment.",
        503
      );
    }

    const localFilename = filename.split("/").pop() ?? filename;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, localFilename), buffer);

    return apiSuccess(
      {
        url: `/uploads/${localFilename}`,
        mediaType,
      },
      201
    );
  } catch (error) {
    console.error("Upload failed:", error);
    return apiError(getErrorMessage(error), 500);
  }
}
