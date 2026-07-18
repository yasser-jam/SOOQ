import type { CollectionProductRef } from "../data-adapter/types";
import { resolveBoundImageUrls } from "./resolve-bound-images";

/** Bound payload shape for collection list items (mirrors product detail API paths). */
export function mapCollectionProductToBoundData(
  product: CollectionProductRef
): Record<string, unknown> {
  const currency = product.currencyCode ?? "SYP";
  const displayPrice =
    product.displayPrice ??
    (product.basePrice != null ? `${product.basePrice} ${currency}` : "");

  const imageUrls = resolveBoundImageUrls({
    product: {
      primaryImageUrl: product.primaryImageUrl,
    },
    images: product.primaryImageUrl
      ? [{ url: product.primaryImageUrl }]
      : [],
  });

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
      tags: product.tags ?? [],
    },
    images: imageUrls.map((url) => ({ url })),
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
