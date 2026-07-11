import { resolveMediaUrl } from "@/core/lib/media";

function extractRawUrl(item: unknown): string | undefined {
  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed || undefined;
  }

  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    const url = String(
      record.url ?? record.imageUrl ?? record.thumbnailUrl ?? ""
    ).trim();
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
