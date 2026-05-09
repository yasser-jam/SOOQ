import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
  InventoryAdjustmentInput,
  InventoryBulkAdjustmentInput,
  InventoryMovement,
  InventoryVariantStatus,
  LowStockVariant,
} from "./types"

export const getProductInventoryStatus = async (
  productId: string
): Promise<InventoryVariantStatus[]> => {
  const response = await api<ApiResponse<InventoryVariantStatus[]>>(
    `/admin/inventory/products/${productId}/status`
  )

  return response.data ?? []
}

export const getVariantInventoryMovements = async (
  variantId: string,
  params: {
    page?: number
    size?: number
  } = {}
): Promise<InventoryMovement[]> => {
  const page = params.page ?? 0
  const size = params.size ?? 20

  const response = await api<ApiResponse<InventoryMovement[]>>(
    `/admin/inventory/variants/${variantId}/movements?page=${page}&size=${size}`
  )

  return response.data ?? []
}

export const adjustInventory = async (
  data: InventoryAdjustmentInput
): Promise<void> => {
  await api<void>("/admin/inventory/adjust", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: data,
  })
}

/**
 * POST /api/v1/admin/inventory/adjust/bulk
 * Bulk adjust multiple variants in one request (CSV-style import flow).
 */
export const bulkAdjustInventory = async (
  data: InventoryBulkAdjustmentInput
): Promise<void> => {
  await api<void>("/admin/inventory/adjust/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: data,
  })
}

/**
 * PUT /api/v1/admin/inventory/variants/{variantId}/threshold?threshold=N
 * Set/update the low-stock alert threshold for a variant.
 */
export const setLowStockThreshold = async (
  variantId: string,
  threshold: number
): Promise<void> => {
  await api<void>(
    `/admin/inventory/variants/${variantId}/threshold?threshold=${threshold}`,
    {
      method: "PUT",
    }
  )
}

/**
 * GET /api/v1/admin/inventory/products/{productId}/low-stock
 * Returns variants under their low-stock threshold for a given product.
 */
export const getLowStockVariants = async (
  productId: string
): Promise<LowStockVariant[]> => {
  const response = await api<ApiResponse<LowStockVariant[]>>(
    `/admin/inventory/products/${productId}/low-stock`
  )
  return response.data ?? []
}
