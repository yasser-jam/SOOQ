import type { ListCodReconciliationBatchesParams } from "./types"

export const codReconciliationQueryKeys = {
  all: ["shipping", "cod", "reconciliation"] as const,
  list: (params: ListCodReconciliationBatchesParams) =>
    [...codReconciliationQueryKeys.all, "list", params] as const,
}
