/**
 * EAV custom attribute types — mirrors backend
 * SOOQ-Back/.../modules/product/dto/ProductAttributeDefinitionDto and
 * ProductAttributeOptionDto.
 *
 * data_type values per spec:
 *   TEXT          — value lives in valueText
 *   NUMBER        — value lives in valueText (BigDecimal-parseable)
 *   BOOLEAN       — value lives in valueText ("true"/"false")
 *   SELECT        — exactly one entry in attributeOptionIds
 *   MULTI_SELECT  — >= 1 entry in attributeOptionIds
 */
export const ATTRIBUTE_DATA_TYPES = [
  "TEXT",
  "NUMBER",
  "BOOLEAN",
  "SELECT",
  "MULTI_SELECT",
] as const

export type AttributeDataType = (typeof ATTRIBUTE_DATA_TYPES)[number]

export type ProductAttributeOption = {
  attributeOptionId?: string
  optionValueAr: string
  optionValueEn: string
  sortOrder?: number
}

export type ProductAttributeDefinition = {
  attributeDefId?: string
  /** When set, definition is scoped to a category; null = tenant-wide */
  categoryId?: string | null
  attributeNameAr: string
  attributeNameEn: string
  /** Stable identifier used by storefront filters; e.g. "color" */
  attributeKey: string
  dataType: AttributeDataType
  isRequired?: boolean
  isFilterable?: boolean
  isVisibleOnStorefront?: boolean
  sortOrder?: number
  /** Required for SELECT/MULTI_SELECT, ignored otherwise */
  options?: ProductAttributeOption[]
}

export type CreateAttributeInput = Omit<ProductAttributeDefinition, "attributeDefId">
export type UpdateAttributeInput = {
  id: string
  data: CreateAttributeInput
}

/**
 * Per-product attribute value (used inside ProductUpsertRequestDto.attributes[]).
 * Validation:
 *   TEXT/NUMBER/BOOLEAN: requires valueText
 *   SELECT/MULTI_SELECT: requires attributeOptionIds
 */
export type ProductAttributeValue = {
  attributeDefId: string
  valueText?: string
  attributeOptionIds?: string[]
}
