import type { FieldErrors } from "react-hook-form"

import { ProductOption } from "./types";

/** Sidebar section ids, in the order they appear in the editor column. */
export const PRODUCT_SECTION_IDS = [
  "basic-info",
  "media",
  "pricing-inventory",
  "variants",
  "categorization-attributes",
  "seo",
] as const

export type ProductSectionId = (typeof PRODUCT_SECTION_IDS)[number]

/**
 * Maps a top-level form field to the editor section that renders it, so a
 * validation failure can be pointed at rather than swallowed.
 */
const FIELD_SECTION: Record<string, ProductSectionId> = {
  titleAr: "basic-info",
  titleEn: "basic-info",
  descriptionAr: "basic-info",
  descriptionEn: "basic-info",
  slug: "basic-info",
  status: "basic-info",
  mediaAssetIds: "media",
  mediaFiles: "media",
  mediaUrls: "media",
  basePrice: "pricing-inventory",
  compareAtPrice: "pricing-inventory",
  currencyCode: "pricing-inventory",
  allowOversell: "pricing-inventory",
  options: "variants",
  variants: "variants",
  categories: "categorization-attributes",
  defaultCategoryId: "categorization-attributes",
  tags: "categorization-attributes",
  attributes: "categorization-attributes",
  seoTitle: "seo",
  seoDescription: "seo",
}

export const sectionForField = (fieldName: string): ProductSectionId | null =>
  FIELD_SECTION[fieldName.split(".")[0] ?? ""] ?? null

type FlatError = {
  name: string
  message: string
  section: ProductSectionId | null
}

/**
 * Walks react-hook-form's nested error tree into a flat, ordered list of
 * `{ dotted.path, message }`. RHF nests errors to mirror the form shape, so
 * array/record failures (`variants.0.attributes`) would otherwise be invisible
 * to any code that only inspects the top level.
 */
export const flattenFormErrors = (
  errors: FieldErrors,
  basePath = ""
): FlatError[] => {
  const flat: FlatError[] = []

  for (const [key, value] of Object.entries(errors ?? {})) {
    if (!value) continue
    const path = basePath ? `${basePath}.${key}` : key

    // A node is a leaf error when it carries RHF's `message` string.
    const message = (value as { message?: unknown }).message
    if (typeof message === "string" && message.length > 0) {
      flat.push({ name: path, message, section: sectionForField(path) })
      continue
    }

    if (typeof value === "object") {
      flat.push(...flattenFormErrors(value as FieldErrors, path))
    }
  }

  return flat
}

/** Section id → "error" for every section that owns at least one failure. */
export const sectionValidationFromErrors = (
  errors: FieldErrors
): Partial<Record<ProductSectionId, "error">> => {
  const status: Partial<Record<ProductSectionId, "error">> = {}
  for (const error of flattenFormErrors(errors)) {
    if (error.section) status[error.section] = "error"
  }
  return status
}

export const normalizeOptionSortOrder = (options: ProductOption[]) =>
  options.map((option, optionIndex) => ({
    ...option,
    sortOrder: optionIndex,
    values: option.values.map((value, valueIndex) => ({
      ...value,
      sortOrder: valueIndex,
    })),
  }))
