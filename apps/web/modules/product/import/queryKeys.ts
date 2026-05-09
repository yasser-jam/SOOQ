export const importQueryKeys = {
  all: ["product-imports"] as const,
  list: (page?: number) =>
    [...importQueryKeys.all, "list", page ?? 0] as const,
  batch: (batchId: string) =>
    [...importQueryKeys.all, "batch", batchId] as const,
}
