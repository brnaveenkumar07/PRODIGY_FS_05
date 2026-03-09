/**
 * Sanitize user content by stripping HTML tags and normalizing whitespace.
 * Content is stored as plain text, so no HTML is allowed.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\0/g, "") // Strip null bytes
    .trim();
}

/**
 * Sanitize a URL - only allow http/https schemes.
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Normalize a tag name: lowercase, trim, alphanumeric + underscore + hyphen only.
 */
export function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "");
}
