export interface InventoryVariantStatus {
  variantId: string
  sku: string
  stockQty: number
  lowStockThreshold: number | null
  isLowStock: boolean
  allowOversell: boolean
}

export interface InventoryLowStockItem {
  productId: string
  productTitle: string
  variant: InventoryVariantStatus
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

export interface InventoryAdjustmentInput {
  variantId: string
  quantityDelta: number
  reasonCode: "MANUAL_ADJUSTMENT"
}

export interface BulkInventoryAdjustmentInput {
  adjustments: Array<{
    variantId: string
    quantityDelta: number
    reasonCode: "MANUAL_ADJUSTMENT" | "IMPORT"
  }>
}
