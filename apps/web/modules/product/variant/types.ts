/**
 * PRD Variant types — mirrors backend DTOs from
 * SOOQ-Back/.../modules/product/dto/.
 *
 * Phase 2 (2026-05-14) folded the variant request into the product upsert as a
 * flat `variants[]` (see [[VariantRequest]] below). Read-side DTOs still come
 * back from the backend in the legacy `options + variants` shape — those types
 * (VariantOptionDto / VariantDto / VariantMatrixResponse / VariantOptionValueDto)
 * stay for the GET path.
 *
 * Per spec (PRD-002, PRD-018):
 *  - Up to 3 option axes (Size × Color × Material)
 *  - Backend derives axes from the union of `attributes` keys across variants
 *  - Combinations omitted from the request become soft-deleted on save
 */

export type VariantOptionValueDto = {
  optionValueId?: string
  valueAr: string
  valueEn: string
  colorHex?: string | null
  sortOrder?: number
}

export type VariantOptionDto = {
  productOptionId?: string
  optionNameAr: string
  optionNameEn: string
  sortOrder?: number
  values: VariantOptionValueDto[]
}

/** A single SKU row (one cell in the matrix) — read-side from GET responses. */
export type VariantDto = {
  variantId?: string
  /** Composed key: e.g. "S|Red". Client-side only; never sent on the wire. */
  optionKey?: string
  optionValueIds?: string[]
  sku: string
  price: number
  compareAtPrice?: number | null
  costPrice?: number | null
  costCurrencyCode?: string | null
  stockQty: number
  lowStockThreshold?: number | null
  weightGrams?: number | null
  barcode?: string | null
  isActive: boolean
}

export type VariantMatrixResponse = {
  options: VariantOptionDto[]
  variants: VariantDto[]
}

/**
 * Phase 2 (PRD): inline variant entry on `POST/PUT /admin/products`.
 * Backend derives option axes from the union of `attributes` keys across all
 * variants in the same request. Every variant must declare the same set of
 * keys; ≤3 axes total; identical attribute maps across two variants is a 400.
 *
 * Convention in SOOQ-Front: axis key = optionNameAr (Arabic-first store).
 * Falls back to optionNameEn when AR is empty. Same rule for value labels.
 *
 * `variantId` is a transient client-side field — used to wire the inventory
 * adjust modal / history drawer to a saved variant. It is stripped before
 * serialization in [[buildProductFormData]].
 */
export type VariantRequest = {
  attributes: Record<string, string>
  sku?: string
  price?: number | null
  compareAtPrice?: number | null
  costPrice?: number | null
  costCurrencyCode?: string | null
  stockQty?: number | null
  lowStockThreshold?: number | null
  weightGrams?: number | null
  barcode?: string | null
  /**
   * Required because the Zod schema applies `.default(true)`. Construction
   * sites should supply an explicit boolean so this stays in lockstep with
   * the inferred `Product["variants"][number]` shape.
   */
  isActive: boolean
  variantId?: string
}

export type SingleVariantUpdate = {
  sku?: string
  price?: number
  compareAtPrice?: number | null
  costPrice?: number | null
  costCurrencyCode?: string | null
  stockQty?: number
  lowStockThreshold?: number | null
  weightGrams?: number | null
  barcode?: string | null
  isActive?: boolean
}
