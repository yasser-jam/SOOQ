import type { ProductAttributeDefinition } from "./types"

export const initAttribute = (
  attribute?: ProductAttributeDefinition
): ProductAttributeDefinition => ({
  attributeDefId: attribute?.attributeDefId ?? "",
  categoryId: attribute?.categoryId ?? null,
  attributeNameAr: attribute?.attributeNameAr ?? "",
  attributeNameEn: attribute?.attributeNameEn ?? "",
  attributeKey: attribute?.attributeKey ?? "",
  dataType: attribute?.dataType ?? "TEXT",
  isRequired: attribute?.isRequired ?? false,
  isFilterable: attribute?.isFilterable ?? false,
  isVisibleOnStorefront: attribute?.isVisibleOnStorefront ?? true,
  sortOrder: attribute?.sortOrder ?? 0,
  options: attribute?.options
    ? attribute.options.map((o) => ({ ...o }))
    : [],
})
