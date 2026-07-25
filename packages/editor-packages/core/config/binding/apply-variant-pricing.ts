/**
 * Return a shallow-cloned payload with `pricing` overridden to reflect the
 * currently-selected variant. Bound blocks that read `pricing.displayPrice`,
 * `pricing.basePrice`, etc. re-render automatically when the URL provider (or
 * Group's inner state) hands them a payload with a swapped `pricing` object.
 *
 * When no variant is selected, or the selected variant can't be found, the
 * original payload is returned unchanged.
 */
export function applyVariantPricing(
  payload: Record<string, unknown> | null,
  selectedVariantId: string | null
): Record<string, unknown> | null {
  if (!payload || !selectedVariantId) return payload;

  const variants = extractVariantList(payload);
  if (variants.length === 0) return payload;

  const selected = variants.find(
    (variant) => String(variant.variantId ?? "") === selectedVariantId
  );
  if (!selected) return payload;

  const currentPricing =
    (payload.pricing as Record<string, unknown> | undefined) ?? {};
  const currencyCode = String(currentPricing.currencyCode ?? "SYP");

  const rawPrice =
    selected.price != null ? Number(selected.price) : undefined;
  const rawCompareAt =
    selected.compareAtPrice != null
      ? Number(selected.compareAtPrice)
      : undefined;

  if (rawPrice == null && rawCompareAt == null) return payload;

  const basePrice = rawPrice ?? Number(currentPricing.basePrice ?? 0);
  const compareAtPrice =
    rawCompareAt ?? Number(currentPricing.compareAtPrice ?? 0);
  const hasDiscount = compareAtPrice > 0 && compareAtPrice > basePrice;
  const discountPercentage = hasDiscount
    ? Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100)
    : 0;

  return {
    ...payload,
    pricing: {
      ...currentPricing,
      basePrice,
      compareAtPrice,
      currencyCode,
      displayPrice: formatCurrency(basePrice, currencyCode),
      displayCompareAt: hasDiscount
        ? formatCurrency(compareAtPrice, currencyCode)
        : "",
      discountPercentage,
      hasDiscount,
    },
  };
}

function extractVariantList(
  payload: Record<string, unknown>
): Array<Record<string, unknown>> {
  const matrix = payload.variantMatrix as
    | { variants?: unknown[] }
    | undefined;
  if (matrix && Array.isArray(matrix.variants)) {
    return matrix.variants as Array<Record<string, unknown>>;
  }
  if (Array.isArray(payload.variants)) {
    return payload.variants as Array<Record<string, unknown>>;
  }
  return [];
}

function formatCurrency(amount: number, currencyCode: string): string {
  const rounded = Number.isInteger(amount) ? amount : Number(amount.toFixed(2));
  return `${rounded} ${currencyCode}`.trim();
}
