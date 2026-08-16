import type { CategoryRef, Product, TagRef, VariantRequest } from "./types"

/**
 * The backend omits optional strings or returns them as `null`. Feeding those
 * straight into the form makes Zod fail with `expected string, received null`
 * — an error react-hook-form cannot attach to an input, so the field renders
 * clean while submit silently aborts. Empty string instead yields the intended
 * "…مطلوب" message on the actual input.
 */
const text = (value: unknown): string =>
  typeof value === "string" ? value : ""

/**
 * Numbers stay `undefined` when absent so the create form opens with empty
 * price inputs rather than a pre-filled 0 the merchant might not notice.
 */
const num = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export const initProduct = (product?: Product) => ({
  titleAr: text(product?.titleAr),
  titleEn: text(product?.titleEn),
  descriptionAr: text(product?.descriptionAr),
  descriptionEn: text(product?.descriptionEn),
  slug: text(product?.slug),
  basePrice: num(product?.basePrice),
  compareAtPrice: num(product?.compareAtPrice),
  currencyCode: product?.currencyCode || "SYP",
  status: product?.status || "ACTIVE",
  seoTitle: text(product?.seoTitle),
  seoDescription: text(product?.seoDescription),
  allowOversell: product?.allowOversell ?? false,
  defaultCategoryId: product?.defaultCategoryId,
  // Phase 1: form state holds mixed `{id}` (saved) + `{name}`/`{nameAr,nameEn}`
  // (typed-this-session) refs in a single array. normalizeGetProduct emits
  // pure-`{id}` shapes from the GET response, so on first load everything is
  // an id and merchants can extend with new entries inline.
  categories: (
    product?.categories ?? []
  ).map((c) => ({ ...c })) as CategoryRef[],
  tags: (product?.tags ?? []).map((t) => ({
    ...t,
  })) as TagRef[],
  mediaUrls: product?.mediaUrls?.length ? [...product.mediaUrls] : [],
  // Always `null` here — the documented tri-state means "leave existing images
  // untouched", and that is exactly the intent until the merchant interacts
  // with the uploader (ImageUploader only emits onChange on a real edit, and
  // the page then writes the explicit kept-id list).
  //
  // Seeding this with the server's id list instead was unsafe: if a GET ever
  // returns media under a key `normalizeProduct` does not recognise, the list
  // hydrates as `[]`, which the serializer sends as `mediaAssets: {clear:true}`
  // — silently deleting every image on the next save of an untouched product.
  mediaAssetIds: null,
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
