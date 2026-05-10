import api from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
  SingleVariantUpdate,
  VariantMatrixRequest,
  VariantMatrixResponse,
} from "./types"

/**
 * Compose the canonical key used to look variants up in the matrix.
 * Mirrors the front-end's variant-matrix composeKey — uses valueEn first
 * (or valueAr as fallback) joined by "|".
 */
const composeVariantKey = (
  optionValues: Array<{ valueAr?: string; valueEn?: string }> | undefined
): string =>
  (optionValues ?? [])
    .map((v) => v.valueEn || v.valueAr || "")
    .join("|")

/**
 * GET /api/v1/admin/products/{productId}/variants
 * Returns the option axes + generated variants for a product.
 *
 * Backend ProductVariantResponseDto carries `optionValues[]` rather than a
 * pre-composed `optionKey`. We compute the key client-side here so the
 * variant-matrix UI can match each row to its server variant.
 */
export const getVariantMatrix = async (
  productId: string
): Promise<VariantMatrixResponse> => {
  const response = await api<ApiResponse<VariantMatrixResponse>>(
    `/admin/products/${productId}/variants`
  )
  const data = response.data
  if (!data) return { options: [], variants: [] }

  return {
    options: data.options ?? [],
    variants: (data.variants ?? []).map((v) => ({
      ...v,
      optionKey:
        v.optionKey ??
        composeVariantKey(
          (v as unknown as {
            optionValues?: Array<{ valueAr?: string; valueEn?: string }>
          }).optionValues
        ),
    })),
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
