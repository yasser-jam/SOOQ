import type { ListCodReconciliationBatchesParams } from "./types"

export const codReconciliationQueryKeys = {
  all: ["shipping", "cod", "reconciliation"] as const,
  list: (params: ListCodReconciliationBatchesParams) =>
    [...codReconciliationQueryKeys.all, "list", params] as const,
  detail: (id: string) =>
    [...codReconciliationQueryKeys.all, "detail", id] as const,
}

export const codEntriesQueryKeys = {
  all: ["shipping", "cod", "entries"] as const,
  byShipment: (shipmentId: string) =>
    [...codEntriesQueryKeys.all, "shipment", shipmentId] as const,
}
