export const shippingProviderQueryKeys = {
  all: ["shipping-providers"] as const,
  detail: (id: string) => [...shippingProviderQueryKeys.all, "detail", id] as const,
}
