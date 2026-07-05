import type { CollectionProductRef } from "@/modules/product/collection/data-store";

/** Bound payload shape for collection list items (mirrors product detail API paths). */
export function mapCollectionProductToBoundData(
  product: CollectionProductRef
): Record<string, unknown> {
  const currency = product.currencyCode ?? "SYP";
  const displayPrice =
    product.displayPrice ??
    (product.basePrice != null ? `${product.basePrice} ${currency}` : "");

  return {
    product: {
      productId: product.id,
      titleAr: product.titleAr ?? "",
      titleEn: product.titleEn ?? "",
      descriptionAr: product.descriptionAr ?? "",
      descriptionEn: product.descriptionEn ?? "",
      slug: product.slug ?? product.id,
      primaryImageUrl: product.primaryImageUrl,
      status: product.status,
    },
    images: product.primaryImageUrl ? [{ url: product.primaryImageUrl }] : [],
    pricing: {
      basePrice: product.basePrice,
      compareAtPrice: product.compareAtPrice,
      currencyCode: currency,
      displayPrice,
    },
  };
}

export function getBoundProductId(
  data: Record<string, unknown> | null | undefined
): string | null {
  if (!data) return null;

  const product = (data.product ?? {}) as Record<string, unknown>;
  const id = String(product.productId ?? product.id ?? "").trim();
  return id || null;
}
