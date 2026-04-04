import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getSession } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function getBlobToken(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return null;

  // Common placeholder values should not be treated as configured credentials.
  if (
    token === "vercel_blob_read_write_token" ||
    token === "your_vercel_blob_token"
  ) {
    return null;
  }

  return token;
}

const MIME_TO_MEDIA_TYPE: Record<string, "image" | "video" | "file"> = {
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/pjpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "image/avif": "image",
  "image/bmp": "image",
  "image/tiff": "image",
  "image/heic": "image",
  "image/heif": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "video/x-msvideo": "video",
  "video/x-matroska": "video",
};

const EXT_TO_MEDIA_TYPE: Record<string, "image" | "video" | "file"> = {
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  avif: "image",
  bmp: "image",
  tif: "image",
  tiff: "image",
  heic: "image",
  heif: "image",
  mp4: "video",
  webm: "video",
  mov: "video",
  avi: "video",
  mkv: "video",
  pdf: "file",
  doc: "file",
  docx: "file",
  xls: "file",
  xlsx: "file",
  ppt: "file",
  pptx: "file",
  txt: "file",
  csv: "file",
  zip: "file",
  rar: "file",
  "7z": "file",
  mp3: "file",
  wav: "file",
  json: "file",
};

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function buildFilename(userId: string, originalName: string, mediaType: "image" | "video" | "file"): string {
  const ext = getExtension(originalName) || (mediaType === "image" ? "jpg" : mediaType === "video" ? "mp4" : "bin");
  return `posts/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
}

function detectMediaType(file: File): "image" | "video" | "file" {
  const mimeType = file.type.toLowerCase();
  if (MIME_TO_MEDIA_TYPE[mimeType]) return MIME_TO_MEDIA_TYPE[mimeType];

  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType) return "file";

  // Some clients send generic or empty MIME type; fallback to extension.
  const ext = getExtension(file.name);
  return EXT_TO_MEDIA_TYPE[ext] ?? "file";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Unknown upload error";
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return apiError("No file provided", 400);
    if (file.size > MAX_SIZE) return apiError("File too large (max 20MB)", 400);

    const mediaType = detectMediaType(file);
    const filename = buildFilename(session.userId, file.name, mediaType);
    const blobToken = getBlobToken();
    const buffer = Buffer.from(await file.arrayBuffer());

    if (blobToken) {
      try {
        const blob = await put(filename, buffer, {
          access: "public",
          addRandomSuffix: false,
          contentType: file.type || undefined,
          token: blobToken,
        });

        return apiSuccess(
          {
            url: blob.url,
            mediaType,
          },
          201
        );
      } catch (error) {
        const message = getErrorMessage(error);
        console.error("Blob upload failed:", error);

        if (IS_PRODUCTION) {
          return apiError(
            `Cloud upload failed: ${message}`,
            500
          );
        }
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
    return apiError("Failed to upload file", 500);
  }
}
