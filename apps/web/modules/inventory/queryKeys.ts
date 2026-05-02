export const inventoryQueryKeys = {
  all: ["inventory"] as const,
  status: (productId: string) =>
    [...inventoryQueryKeys.all, "status", productId] as const,
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
