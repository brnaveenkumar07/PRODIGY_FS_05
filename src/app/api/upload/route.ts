import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getSession } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const IS_VERCEL = process.env.VERCEL === "1";

const MIME_TO_MEDIA_TYPE: Record<string, "image" | "video"> = {
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

const EXT_TO_MEDIA_TYPE: Record<string, "image" | "video"> = {
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
};

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function detectMediaType(file: File): "image" | "video" | null {
  const mimeType = file.type.toLowerCase();
  if (MIME_TO_MEDIA_TYPE[mimeType]) return MIME_TO_MEDIA_TYPE[mimeType];

  // Some clients send generic or empty MIME type; fallback to extension.
  const ext = getExtension(file.name);
  return EXT_TO_MEDIA_TYPE[ext] ?? null;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  try {
    if (IS_VERCEL) {
      return apiError(
        "File uploads are not configured for Vercel yet. Use external object storage like Vercel Blob, S3, or Cloudinary.",
        501
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return apiError("No file provided", 400);
    if (file.size > MAX_SIZE) return apiError("File too large (max 20MB)", 400);

    const mediaType = detectMediaType(file);
    if (!mediaType) {
      return apiError("Unsupported file type. Please upload a common image or video format.", 400);
    }

    const ext = getExtension(file.name) || (mediaType === "image" ? "jpg" : "mp4");
    const filename = `${session.userId}-${Date.now()}.${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(UPLOAD_DIR, filename), buffer);

    return apiSuccess(
      {
        url: `/uploads/${filename}`,
        mediaType,
      },
      201
    );
  } catch {
    return apiError("Failed to upload file", 500);
  }
}
