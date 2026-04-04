export type MediaType = "image" | "video" | "file";

export const MAX_UPLOAD_SIZE = 100 * 1024 * 1024; // 100MB

const MIME_TO_MEDIA_TYPE: Record<string, MediaType> = {
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
  "image/svg+xml": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "video/x-msvideo": "video",
  "video/x-matroska": "video",
  "video/x-ms-wmv": "video",
  "audio/mpeg": "file",
  "audio/mp3": "file",
  "audio/wav": "file",
  "audio/x-wav": "file",
  "audio/ogg": "file",
  "audio/mp4": "file",
  "audio/aac": "file",
  "audio/flac": "file",
  "application/pdf": "file",
  "text/plain": "file",
  "text/csv": "file",
  "application/json": "file",
  "application/zip": "file",
  "application/x-rar-compressed": "file",
  "application/x-7z-compressed": "file",
  "application/msword": "file",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "file",
  "application/vnd.ms-excel": "file",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "file",
  "application/vnd.ms-powerpoint": "file",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "file",
};

const EXT_TO_MEDIA_TYPE: Record<string, MediaType> = {
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
  svg: "image",
  mp4: "video",
  webm: "video",
  mov: "video",
  avi: "video",
  mkv: "video",
  wmv: "video",
  mp3: "file",
  wav: "file",
  ogg: "file",
  m4a: "file",
  aac: "file",
  flac: "file",
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
  json: "file",
};

export const ALLOWED_CONTENT_TYPES = [
  "image/*",
  "video/*",
  "audio/*",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export const FILE_INPUT_ACCEPT = [
  "image/*",
  "video/*",
  "audio/*",
  ".pdf",
  ".txt",
  ".csv",
  ".json",
  ".zip",
  ".rar",
  ".7z",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
].join(",");

export function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function detectMediaType(input: {
  type?: string | null;
  name: string;
}): MediaType {
  const mimeType = input.type?.toLowerCase().trim() ?? "";
  if (mimeType && MIME_TO_MEDIA_TYPE[mimeType]) return MIME_TO_MEDIA_TYPE[mimeType];

  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "file";
  if (mimeType) return "file";

  return EXT_TO_MEDIA_TYPE[getExtension(input.name)] ?? "file";
}

export function isAllowedUpload(input: {
  type?: string | null;
  name: string;
}): boolean {
  const mimeType = input.type?.toLowerCase().trim() ?? "";
  const ext = getExtension(input.name);

  if (mimeType) {
    if (MIME_TO_MEDIA_TYPE[mimeType]) return true;
    if (mimeType.startsWith("image/")) return true;
    if (mimeType.startsWith("video/")) return true;
    if (mimeType.startsWith("audio/")) return true;
  }

  return ext in EXT_TO_MEDIA_TYPE;
}

export function buildFilename(
  userId: string,
  originalName: string,
  mediaType: MediaType
): string {
  const ext =
    getExtension(originalName) ||
    (mediaType === "image" ? "jpg" : mediaType === "video" ? "mp4" : "bin");

  return `posts/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
}

export function isAllowedUploadPathname(pathname: string, userId: string): boolean {
  return pathname.startsWith(`posts/${userId}/`) && isAllowedUpload({ name: pathname });
}

export function getUploadValidationError(file: File): string | null {
  if (file.size > MAX_UPLOAD_SIZE) {
    return "File too large. Please keep uploads under 100MB.";
  }

  if (!isAllowedUpload(file)) {
    return "Unsupported file type. Upload images, videos, audio, or common document formats.";
  }

  return null;
}
