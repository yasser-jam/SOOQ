import type {
  ProductCardData,
  ProductResourceMetadata,
} from "@/modules/product/product/data-store";
import type { ProductCardActionEventDetail } from "./product-actions";

/**
 * Build a ProductCardData view-model from a bound API payload for cart events.
 * Mirrors the server mapper shape used by fetchProductForCardFromUrl.
 */
export function mapPayloadToProductCardData(
  payload: Record<string, unknown>
): ProductCardData | null {
  const product = (payload.product ?? {}) as Record<string, unknown>;
  const pricing = (payload.pricing ?? {}) as Record<string, unknown>;
  const inventory = (payload.inventory ?? {}) as Record<string, unknown>;
  const id = String(product.productId ?? product.id ?? "");

  if (!id) return null;

  const images = (payload.images ?? []) as Array<Record<string, unknown>>;
  const mediaUrls = images
    .map((item) => String(item.url ?? item.imageUrl ?? ""))
    .filter(Boolean);

  if (mediaUrls.length === 0) {
    const primary = product.primaryImageUrl ?? product.primaryThumbnailUrl;
    if (primary) mediaUrls.push(String(primary));
  }

  const rawVariants = Array.isArray(
    (payload.variantMatrix as { variants?: unknown[] })?.variants
  )
    ? ((payload.variantMatrix as { variants: Array<Record<string, unknown>> })
        .variants ?? [])
    : Array.isArray(payload.variants)
      ? (payload.variants as Array<Record<string, unknown>>)
      : [];

  const variants = rawVariants.map((variant) => ({
    variantId:
      variant.variantId != null ? String(variant.variantId) : undefined,
    attributes: {},
    price: Number(variant.price ?? pricing.basePrice ?? 0),
    compareAtPrice: Number(variant.compareAtPrice ?? pricing.compareAtPrice ?? 0),
    stockQty: variant.stockQty == null ? null : Number(variant.stockQty),
    lowStockThreshold:
      variant.lowStockThreshold == null
        ? null
        : Number(variant.lowStockThreshold),
    isActive: variant.isActive !== false,
  }));

  const basePrice = Number(pricing.basePrice ?? 0);
  const compareAtPrice = Number(pricing.compareAtPrice ?? 0);
  const firstVariant = variants[0] ?? null;
  const price = firstVariant?.price ?? basePrice;
  const compareAt = firstVariant?.compareAtPrice ?? compareAtPrice;

  return {
    id,
    titleAr: String(product.titleAr ?? ""),
    titleEn: String(product.titleEn ?? ""),
    descriptionAr: String(product.descriptionAr ?? ""),
    descriptionEn: String(product.descriptionEn ?? ""),
    slug: String(product.slug ?? id),
    basePrice: price,
    compareAtPrice: compareAt,
    currencyCode: String(pricing.currencyCode ?? "SYP"),
    status: String(product.status ?? "DRAFT"),
    allowOversell: Boolean(inventory.allowOversell ?? product.allowOversell),
    categories: [],
    tags: [],
    mediaUrls,
    options: [],
    variants: variants.length > 0 ? variants : [
      {
        variantId: id,
        attributes: {},
        price,
        compareAtPrice: compareAt,
        stockQty: null,
        isActive: true,
      },
    ],
  };
}

export function buildProductActionDetail(
  payload: Record<string, unknown>,
  language: "ar" | "en",
  metadata: ProductResourceMetadata | null,
  selectedVariantId?: string | null
): ProductCardActionEventDetail | null {
  const product = mapPayloadToProductCardData(payload);
  if (!product) return null;

  const selectedVariant =
    (selectedVariantId
      ? product.variants.find((variant) => variant.variantId === selectedVariantId)
      : null) ??
    product.variants[0] ??
    null;
  const price = selectedVariant?.price ?? product.basePrice;
  const compareAt = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const hasDiscount = compareAt > 0 && compareAt > price;
  const stockQty = selectedVariant?.stockQty;
  let stockStatus: "in_stock" | "low_stock" | "out_of_stock" | "unknown" =
    "unknown";

  if (stockQty != null) {
    if (stockQty <= 0) {
      stockStatus = product.allowOversell ? "in_stock" : "out_of_stock";
    } else if (
      selectedVariant?.lowStockThreshold != null &&
      stockQty <= selectedVariant.lowStockThreshold
    ) {
      stockStatus = "low_stock";
    } else {
      stockStatus = "in_stock";
    }
  }

  return {
    product,
    selectedVariant,
    selectedAttributes: {},
    pricing: {
      price,
      compareAt: hasDiscount ? compareAt : null,
      discountPercent: hasDiscount
        ? Math.round(((compareAt - price) / compareAt) * 100)
        : 0,
      hasDiscount,
    },
    stockStatus,
    language,
    metadata,
  };
}
