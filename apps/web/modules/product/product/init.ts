import type { CategoryRef, Product, TagRef, VariantRequest } from "./types"

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
  // Phase 1: form state holds mixed `{id}` (saved) + `{name}`/`{nameAr,nameEn}`
  // (typed-this-session) refs in a single array. normalizeGetProduct emits
  // pure-`{id}` shapes from the GET response, so on first load everything is
  // an id and merchants can extend with new entries inline.
  categories: (product?.categories ?? []).map((c) => ({ ...c })) as CategoryRef[],
  tags: (product?.tags ?? []).map((t) => ({ ...t })) as TagRef[],
  mediaUrls: product?.mediaUrls?.length ? [...product.mediaUrls] : [],
  // null on edit = leave existing images unchanged; on create the form will populate this with new file UUIDs after upload
  mediaAssetIds: product?.mediaAssetIds ?? null,
  // transient: only contains files the user just added in this editor session
  mediaFiles: [] as File[],
  // EAV custom attribute values; populated by AttributesTab against the schema
  // returned by GET /admin/product-attributes?categoryId=...
  attributes: (product as unknown as { attributes?: unknown[] })?.attributes
    ? ((product as unknown as { attributes: unknown[] }).attributes as never[])
    : ([] as never[]),

  options: (product?.options ?? []).map((option) => ({
    ...option,
    values: option.values.map((value) => ({ ...value })),
  })),
  // Phase 2 (PRD): hydrated by normalizeGetProduct from variantMatrix.variants[].
  // Each entry carries an `attributes` map (axis name → value) plus optional
  // SKU/price/stock and a transient variantId for the inventory adjust modal.
  variants: ((product?.variants ?? []) as VariantRequest[]).map((v) => ({
    ...v,
    attributes: { ...v.attributes },
  })),
})
