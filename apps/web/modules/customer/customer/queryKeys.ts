export const customerQueryKeys = {
  all: ["customers"] as const,
  list: (params?: Record<string, unknown>) =>
    [...customerQueryKeys.all, "list", params ?? {}] as const,
  detail: (customerId: string) =>
    [...customerQueryKeys.all, "detail", customerId] as const,
}
