const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_URL ?? "";

/**
 * Resolves a media path from the API into a full display URL.
 * Absolute URLs are returned as-is; relative paths are prefixed with
 * NEXT_PUBLIC_MEDIA_URL.
 */
export function resolveMediaUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  if (!MEDIA_BASE) return trimmed;

  const base = MEDIA_BASE.replace(/\/$/, "");
  const path = trimmed.replace(/^\//, "");
  return `${base}/${path}`;
}
