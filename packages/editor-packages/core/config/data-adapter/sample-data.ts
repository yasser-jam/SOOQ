import type {
  CollectionProductRef,
  ProductDetailPayload,
  ProductPickerRef,
} from "./types";

/**
 * Network-free sample catalog for the edit canvas (C2-5) and for rendering
 * outside any registered adapter (tests, storybook, future builders).
 * Images are inline SVG data URIs so the canvas renders instantly offline.
 */

const sampleImage = (label: string, bg: string, fg = "#ffffff"): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">` +
      `<rect width="100%" height="100%" fill="${bg}"/>` +
      `<circle cx="300" cy="240" r="90" fill="${fg}" opacity="0.25"/>` +
      `<rect x="150" y="380" width="300" height="26" rx="13" fill="${fg}" opacity="0.35"/>` +
      `<rect x="200" y="430" width="200" height="18" rx="9" fill="${fg}" opacity="0.25"/>` +
      `<text x="50%" y="46%" font-family="sans-serif" font-size="40" fill="${fg}" text-anchor="middle" dominant-baseline="middle">${label}</text>` +
      `</svg>`
  )}`;

export const SAMPLE_COLLECTION_PRODUCTS: CollectionProductRef[] = [
  {
    id: "sample-product-1",
    titleAr: "عطر شرقي فاخر",
    titleEn: "Oriental Perfume",
    slug: "sample-oriental-perfume",
    descriptionAr: "عطر شرقي بمكونات طبيعية يدوم طويلاً.",
    descriptionEn: "Long-lasting oriental perfume with natural notes.",
    basePrice: 85000,
    compareAtPrice: 110000,
    currencyCode: "SYP",
    displayPrice: "85,000 SYP",
    status: "ACTIVE",
    primaryImageUrl: sampleImage("عطر", "#7c5cbf"),
  },
  {
    id: "sample-product-2",
    titleAr: "حقيبة جلدية يدوية",
    titleEn: "Leather Handbag",
    slug: "sample-leather-handbag",
    descriptionAr: "حقيبة جلد طبيعي بصناعة يدوية متقنة.",
    descriptionEn: "Handcrafted natural leather handbag.",
    basePrice: 145000,
    currencyCode: "SYP",
    displayPrice: "145,000 SYP",
    status: "ACTIVE",
    primaryImageUrl: sampleImage("حقيبة", "#b8763e"),
  },
  {
    id: "sample-product-3",
    titleAr: "ساعة كلاسيكية",
    titleEn: "Classic Watch",
    slug: "sample-classic-watch",
    descriptionAr: "ساعة أنيقة بتصميم كلاسيكي خالد.",
    descriptionEn: "Elegant watch with a timeless design.",
    basePrice: 230000,
    compareAtPrice: 260000,
    currencyCode: "SYP",
    displayPrice: "230,000 SYP",
    status: "ACTIVE",
    primaryImageUrl: sampleImage("ساعة", "#3e6bb8"),
  },
  {
    id: "sample-product-4",
    titleAr: "حذاء رياضي خفيف",
    titleEn: "Running Shoes",
    slug: "sample-running-shoes",
    descriptionAr: "حذاء رياضي مريح للاستخدام اليومي.",
    descriptionEn: "Comfortable everyday running shoes.",
    basePrice: 120000,
    currencyCode: "SYP",
    displayPrice: "120,000 SYP",
    status: "ACTIVE",
    primaryImageUrl: sampleImage("حذاء", "#3f9d6e"),
  },
];

/**
 * Deterministically assign one of the sample products to an arbitrary
 * product id, so saved cards referencing real products still render varied
 * sample data in the canvas.
 */
export function pickSampleCollectionProduct(
  productId: string
): CollectionProductRef {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash * 31 + productId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % SAMPLE_COLLECTION_PRODUCTS.length;
  return SAMPLE_COLLECTION_PRODUCTS[index] ?? SAMPLE_COLLECTION_PRODUCTS[0]!;
}

/**
 * Product-detail-shaped payload for a sample product. When a picker ref is
 * provided, its identity fields (title/slug) are kept so merchants still see
 * the product THEY picked, with sample pricing/images filling the rest.
 */
export function buildSampleProductPayload(
  ref?: ProductPickerRef | null
): ProductDetailPayload {
  const base = ref?.id
    ? pickSampleCollectionProduct(ref.id)
    : SAMPLE_COLLECTION_PRODUCTS[0]!;

  return {
    product: {
      productId: ref?.id ?? base.id,
      titleAr: ref?.titleAr?.trim() || base.titleAr,
      titleEn: ref?.titleEn?.trim() || base.titleEn,
      descriptionAr: base.descriptionAr,
      descriptionEn: base.descriptionEn,
      slug: ref?.slug ?? base.slug,
      status: base.status,
      primaryImageUrl: base.primaryImageUrl,
    },
    images: [{ url: base.primaryImageUrl }],
    pricing: {
      basePrice: base.basePrice,
      compareAtPrice: base.compareAtPrice ?? 0,
      currencyCode: base.currencyCode ?? "SYP",
      displayPrice: base.displayPrice,
    },
    variantMatrix: {
      variants: [
        {
          variantId: `${ref?.id ?? base.id}-default`,
          price: base.basePrice,
          compareAtPrice: base.compareAtPrice ?? 0,
          stockQty: 25,
          isActive: true,
        },
      ],
    },
  };
}
