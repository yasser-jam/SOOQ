export interface InventoryVariantStatus {
  variantId: string
  sku: string
  stockQty: number
  lowStockThreshold: number | null
  isLowStock: boolean
  allowOversell: boolean
}

export interface InventoryMovement {
  movementId: string
  variantId: string
  quantityDelta: number
  balanceAfter: number
  reasonCode: string
  referenceType: string | null
  referenceId: string | null
  actorUserId: string | null
  createdAt: string
}

export const INVENTORY_REASON_CODES = [
  "MANUAL_ADJUSTMENT",
  "ORDER_PLACED",
  "ORDER_CANCELLED",
  "RETURN_APPROVED",
  "IMPORT",
] as const

export type InventoryReasonCode = (typeof INVENTORY_REASON_CODES)[number]

export interface InventoryAdjustmentInput {
  variantId: string
  quantityDelta: number
  reasonCode: InventoryReasonCode
  notes?: string
}

export interface InventoryBulkAdjustmentInput {
  adjustments: InventoryAdjustmentInput[]
}

export interface LowStockVariant {
  variantId: string
  sku: string
  stockQty: number
  lowStockThreshold: number | null
}
