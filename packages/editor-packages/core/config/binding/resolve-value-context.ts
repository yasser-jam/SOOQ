type ResolveOptions = {
  locale?: "ar" | "en";
};

const LOCALE_SHORTHANDS: Record<string, { ar: string; en: string }> = {
  "product.title": { ar: "product.titleAr", en: "product.titleEn" },
  "product.description": {
    ar: "product.descriptionAr",
    en: "product.descriptionEn",
  },
};

function tokenizePath(path: string): string[] {
  const tokens: string[] = [];
  const re = /([^.\[\]]+)|\[(\d+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(path)) !== null) {
    tokens.push(match[1] ?? match[2]);
  }

  return tokens;
}

function resolvePath(data: unknown, path: string): unknown {
  if (!path.trim()) return undefined;

  const tokens = tokenizePath(path);
  let current: unknown = data;

  for (const token of tokens) {
    if (current == null || typeof current !== "object") return undefined;

    if (Array.isArray(current)) {
      const index = Number(token);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
      continue;
    }

    current = (current as Record<string, unknown>)[token];
  }

  return current;
}

function resolveShorthandPath(path: string, locale: "ar" | "en"): string {
  const shorthand = LOCALE_SHORTHANDS[path];
  if (shorthand) return shorthand[locale];

  if (path === "images[0].url") {
    return path;
  }

  return path;
}

function resolveImageUrl(data: Record<string, unknown>): string | undefined {
  const images = data.images;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string" && first.trim()) return first.trim();
    if (first && typeof first === "object") {
      const record = first as Record<string, unknown>;
      const url = String(
        record.url ?? record.imageUrl ?? record.thumbnailUrl ?? ""
      ).trim();
      if (url) return url;
    }
  }

  const gallery = data.gallery;
  if (Array.isArray(gallery) && gallery.length > 0) {
    const first = gallery[0] as Record<string, unknown> | string;
    if (typeof first === "string") return first;
    const url = String(first.url ?? first.imageUrl ?? "").trim();
    if (url) return url;
  }

  const product = (data.product ?? {}) as Record<string, unknown>;
  const primary = product.primaryImageUrl ?? product.primaryThumbnailUrl;
  if (primary) return String(primary);

  return undefined;
}

/**
 * Resolve a valueContext path against bound API payload data.
 */
export function resolveValueContext(
  path: string,
  data: unknown,
  options: ResolveOptions = {}
): unknown {
  if (!path.trim() || data == null) return undefined;

  const locale = options.locale ?? "ar";
  const resolvedPath = resolveShorthandPath(path, locale);

  if (resolvedPath === "images[0].url" && typeof data === "object") {
    return resolveImageUrl(data as Record<string, unknown>);
  }

  return resolvePath(data, resolvedPath);
}

export function resolveValueContextAsString(
  path: string,
  data: unknown,
  options: ResolveOptions = {}
): string | undefined {
  const value = resolveValueContext(path, data, options);
  if (value == null) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}
