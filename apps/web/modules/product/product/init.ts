import type { CategoryRef, Product, TagRef, VariantRequest } from "./types"

export const initProduct = (product?: Product) => ({
  titleAr: product?.titleAr || "هاتف ذكي تجريبي 128GB",
  titleEn: product?.titleEn || "Demo Smartphone 128GB",
  descriptionAr:
    product?.descriptionAr ||
    "منتج تجريبي لاختبار تجربة إضافة المنتجات بدون اتصال بالباك.",
  descriptionEn:
    product?.descriptionEn ||
    "Demo product for testing product creation without a backend.",
  slug: product?.slug || "demo-smartphone-128gb",
  basePrice: product?.basePrice ?? 125000,
  compareAtPrice: product?.compareAtPrice ?? 150000,
  currencyCode: product?.currencyCode || "SYP",
  status: product?.status || "ACTIVE",
  seoTitle: product?.seoTitle || "هاتف ذكي تجريبي 128GB",
  seoDescription:
    product?.seoDescription ||
    "هاتف ذكي تجريبي لاختبار تجربة إدارة المنتجات في لوحة التحكم.",
  allowOversell: product?.allowOversell ?? false,
  defaultCategoryId: product?.defaultCategoryId || "dev-category-electronics",
  // Phase 1: form state holds mixed `{id}` (saved) + `{name}`/`{nameAr,nameEn}`
  // (typed-this-session) refs in a single array. normalizeGetProduct emits
  // pure-`{id}` shapes from the GET response, so on first load everything is
  // an id and merchants can extend with new entries inline.
  categories: (
    product?.categories ?? [{ id: "dev-category-electronics" }]
  ).map((c) => ({ ...c })) as CategoryRef[],
  tags: (product?.tags ?? [{ id: "dev-tag-demo" }]).map((t) => ({
    ...t,
  })) as TagRef[],
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
