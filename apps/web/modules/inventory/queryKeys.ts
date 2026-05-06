export const inventoryQueryKeys = {
  all: ["inventory"] as const,
  status: (productId: string) =>
    [...inventoryQueryKeys.all, "status", productId] as const,
  lowStock: (productId: string) =>
    [...inventoryQueryKeys.all, "low-stock", productId] as const,
  lowStockAll: () => [...inventoryQueryKeys.all, "low-stock-all"] as const,
  movementList: (variantId: string) =>
    [...inventoryQueryKeys.all, "movements", variantId] as const,
  movements: (
    variantId: string,
    params?: {
      page?: number
      size?: number
    }
  ) => [...inventoryQueryKeys.movementList(variantId), params ?? {}] as const,
}
