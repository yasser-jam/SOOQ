import type { Product } from "./types"

export const initProduct = (product?: Product) => ({
  titleAr: product?.titleAr || "",
  titleEn: product?.titleEn || "",
  descriptionAr: product?.descriptionAr || "",
  descriptionEn: product?.descriptionEn || "",
  slug: product?.slug || "",
  basePrice: product?.basePrice ?? 0,
  compareAtPrice: product?.compareAtPrice ?? 0,
  currencyCode: product?.currencyCode || "SYP",
  status: product?.status || "DRAFT",
  seoTitle: product?.seoTitle || "",
  seoDescription: product?.seoDescription || "",
  allowOversell: product?.allowOversell ?? false,
  defaultCategoryId: product?.defaultCategoryId || "",
  categoryIds: product?.categoryIds?.length ? [...product?.categoryIds] : [],
  tagIds: product?.tagIds?.length ? [...product.tagIds] : [],
  mediaUrls: product?.mediaUrls?.length ? [...product.mediaUrls] : [],

  options: (product?.options ?? []).map((option) => ({
    ...option,
    values: option.values.map((value) => ({ ...value })),
  })),
})
