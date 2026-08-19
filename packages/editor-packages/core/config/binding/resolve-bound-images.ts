import { resolveMediaUrl } from "../../lib/media";

/** Largest available size from a `thumbnailUrls` map, e.g. `{ "150": …, "300": …, "600": … }`. */
function pickLargestThumbnail(thumbnailUrls: unknown): string | undefined {
  if (!thumbnailUrls || typeof thumbnailUrls !== "object") return undefined;

  const sizes = Object.keys(thumbnailUrls as Record<string, unknown>)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => b - a);

  for (const size of sizes) {
    const value = (thumbnailUrls as Record<string, unknown>)[String(size)];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return undefined;
}

function extractRawUrl(item: unknown): string | undefined {
  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed || undefined;
  }

  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    const url =
      String(
        record.url ??
          record.imageUrl ??
          record.publicUrl ??
          record.thumbnailUrl ??
          ""
      ).trim() || pickLargestThumbnail(record.thumbnailUrls);
    return url || undefined;
  }

  return undefined;
}

function collectRawImageUrls(data: Record<string, unknown>): string[] {
  const rawUrls: string[] = [];

  const images = data.images;
  if (Array.isArray(images)) {
    for (const item of images) {
      const url = extractRawUrl(item);
      if (url) rawUrls.push(url);
    }
  }

  const gallery = data.gallery;
  if (Array.isArray(gallery)) {
    for (const item of gallery) {
      const url = extractRawUrl(item);
      if (url) rawUrls.push(url);
    }
  }

  const product = (data.product ?? {}) as Record<string, unknown>;
  const media = product.media;
  if (Array.isArray(media)) {
    for (const item of media) {
      const url = extractRawUrl(item);
      if (url) rawUrls.push(url);
    }
  }

  const primary = product.primaryImageUrl ?? product.primaryThumbnailUrl;
  if (primary) rawUrls.push(String(primary));

  return rawUrls;
}

/** All display-ready image URLs from a bound product/collection/cart payload. */
export function resolveBoundImageUrls(
  data: Record<string, unknown>
): string[] {
  const seen = new Set<string>();
  const resolved: string[] = [];

  for (const raw of collectRawImageUrls(data)) {
    const url = resolveMediaUrl(raw) ?? raw;
    if (!seen.has(url)) {
      seen.add(url);
      resolved.push(url);
    }
  }

  return resolved;
}

/** First display-ready image URL from bound API payload data. */
export function resolveBoundImageUrl(
  data: Record<string, unknown>
): string | undefined {
  return resolveBoundImageUrls(data)[0];
}
