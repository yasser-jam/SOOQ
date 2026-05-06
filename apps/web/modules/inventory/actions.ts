import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
  BulkInventoryAdjustmentInput,
  InventoryAdjustmentInput,
  InventoryMovement,
  InventoryVariantStatus,
  InventoryLowStockItem,
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

export const bulkAdjustInventory = async (
  data: BulkInventoryAdjustmentInput
): Promise<void> => {
  await api<void>("/admin/inventory/adjust/bulk", {
    method: "POST",
    body: data,
  })
}

export const getLowStockVariants = async (
  productId: string
): Promise<InventoryVariantStatus[]> => {
  const response = await api<ApiResponse<InventoryVariantStatus[]>>(
    `/admin/inventory/products/${productId}/low-stock`
  )

  return response.data ?? []
}

export const setInventoryThreshold = async (
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

export const getAllLowStockVariants = async (): Promise<InventoryLowStockItem[]> => {
  const { listProducts } = await import("../product/product/actions")
  const productsRes = await listProducts()
  const products = productsRes.data || []

  const promises = products.map(async (p) => {
    try {
      const variants = await getLowStockVariants(p.id)
      return (variants || []).map((v) => ({
        productId: p.id,
        productTitle: p.titleAr || p.titleEn || p.id,
        variant: v,
      }))
    } catch {
      return []
    }
  })

  const nested = await Promise.all(promises)
  return nested.flat()
}
