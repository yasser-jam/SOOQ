import api from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
  SingleVariantUpdate,
  VariantMatrixRequest,
  VariantMatrixResponse,
} from "./types"

/**
 * GET /api/v1/admin/products/{productId}/variants
 * Returns the option axes + generated variants for a product.
 */
export const getVariantMatrix = async (
  productId: string
): Promise<VariantMatrixResponse> => {
  const response = await api<ApiResponse<VariantMatrixResponse>>(
    `/admin/products/${productId}/variants`
  )
  return (
    response.data ?? {
      options: [],
      variants: [],
    }
  )
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
