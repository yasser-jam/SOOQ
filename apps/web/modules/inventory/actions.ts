import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
  InventoryAdjustmentInput,
  InventoryMovement,
  InventoryVariantStatus,
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
    body: data,
  })
}
