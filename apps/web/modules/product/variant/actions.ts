import api from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
  SingleVariantUpdate,
  VariantMatrixRequest,
  VariantMatrixResponse,
  VariantOptionDto,
} from "./types"

/**
 * Canonical key for matching matrix cells <-> server variants.
 * Mirrors the variant-matrix composeKey (valueEn || valueAr, joined by "|").
 */
const composeVariantKey = (
  optionValues: Array<{ valueAr?: string; valueEn?: string }> | undefined
): string =>
  (optionValues ?? [])
    .map((v) => v.valueEn || v.valueAr || "")
    .join("|")

const optionDedupKey = (
  o: VariantOptionDto | { optionNameAr?: string; optionNameEn?: string }
) =>
  ((o as { optionNameEn?: string }).optionNameEn ||
    (o as { optionNameAr?: string }).optionNameAr ||
    "")
    .trim()
    .toLowerCase()

/**
 * GET /api/v1/admin/products/{productId}/variants
 * Returns the option axes + generated variants for a product.
 *
 * Two normalizations applied client-side:
 *  1. Backend ProductVariantResponseDto carries `optionValues[]` rather than a
 *     pre-composed `optionKey`. We compute the key here so the matrix UI can
 *     match each row to its server variant.
 *  2. Backend can leak duplicate option axes when a product is saved multiple
 *     times without sending productOptionId for existing options. We dedupe
 *     by optionName, keeping the first occurrence and counting duplicates so
 *     the UI can warn the user. Variants always reference real optionValueId
 *     references, but their composed valueEn key still matches the deduped
 *     axes since duplicates carry identical value labels.
 */
export type GetVariantMatrixResult = VariantMatrixResponse & {
  duplicateOptionCount: number
  removedOptionIds: string[]
}

export const getVariantMatrix = async (
  productId: string
): Promise<GetVariantMatrixResult> => {
  const response = await api<ApiResponse<VariantMatrixResponse>>(
    `/admin/products/${productId}/variants`
  )
  const data = response.data
  if (!data) {
    return {
      options: [],
      variants: [],
      duplicateOptionCount: 0,
      removedOptionIds: [],
    }
  }

  const seen = new Set<string>()
  const dedupedOptions: VariantOptionDto[] = []
  const removedOptionIds: string[] = []
  for (const opt of data.options ?? []) {
    const key = optionDedupKey(opt)
    if (!key) continue
    if (seen.has(key)) {
      if (opt.productOptionId) removedOptionIds.push(opt.productOptionId)
      continue
    }
    seen.add(key)
    dedupedOptions.push(opt)
  }

  const variants = (data.variants ?? []).map((v) => ({
    ...v,
    optionKey:
      v.optionKey ??
      composeVariantKey(
        (v as unknown as {
          optionValues?: Array<{ valueAr?: string; valueEn?: string }>
        }).optionValues
      ),
  }))

  return {
    options: dedupedOptions,
    variants,
    duplicateOptionCount: removedOptionIds.length,
    removedOptionIds,
  }
}

/**
 * PUT /api/v1/admin/products/{productId}/variants
 * Saves the entire matrix. Backend regenerates Cartesian product from `options`
 * and applies `variantOverrides` keyed by composed option key. Combinations
 * not present in the new payload become soft-deleted server-side.
 */
export const saveVariantMatrix = async (
  productId: string,
  payload: VariantMatrixRequest
): Promise<VariantMatrixResponse> => {
  const response = await api<ApiResponse<VariantMatrixResponse>>(
    `/admin/products/${productId}/variants`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: payload,
    }
  )
  return (
    response.data ?? {
      options: [],
      variants: [],
    }
  )
}

/**
 * PUT /api/v1/admin/products/{productId}/variants/{variantId}
 * Updates a single SKU row (used for cell-level edits AFTER the matrix exists).
 */
export const updateSingleVariant = async (
  productId: string,
  variantId: string,
  patch: SingleVariantUpdate
): Promise<void> => {
  await api(`/admin/products/${productId}/variants/${variantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: patch,
  })
}
