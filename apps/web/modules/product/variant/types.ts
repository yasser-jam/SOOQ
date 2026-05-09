/**
 * PRD Variant types — mirrors backend DTOs from
 * SOOQ-Back/.../modules/product/dto/VariantMatrixRequestDto and friends.
 *
 * Per spec (PRD-002, PRD-018):
 *  - Up to 3 option axes (Size × Color × Material)
 *  - Backend regenerates the Cartesian product on bulk PUT and soft-deletes
 *    combinations the new payload no longer contains.
 *  - Per-cell edits (after the matrix exists) hit the per-variant PUT.
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

/** A single SKU row (one cell in the matrix). */
export type VariantDto = {
  variantId?: string
  /** Composed key: e.g. "S|Red" — order follows option axes; used for variantOverrides keying. */
  optionKey?: string
  /** Map<optionValueId, optionValueLabel> showing which axes this variant occupies. */
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
 * Bulk save payload — backend regenerates Cartesian product from `options` and
 * applies `variantOverrides` per composed key. Combinations not present become
 * soft-deleted.
 */
export type VariantMatrixRequest = {
  options: VariantOptionDto[]
  /** Keyed by composed option-key (e.g. "S|Red"). Backend looks up by sortOrder of values. */
  variantOverrides?: Record<string, Partial<VariantDto>>
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
