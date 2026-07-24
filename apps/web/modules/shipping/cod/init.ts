import type {
  CodSettlementStatus,
  CreateCodReconciliationBatchPayload,
  UpdateCodReconciliationStatusInput,
} from "./types"

export const initCreateCodReconciliationBatch = (
  data: CreateCodReconciliationBatchPayload
): CreateCodReconciliationBatchPayload => data

export const initCodReconciliationStatusUpdate = (
  id: string,
  status: CodSettlementStatus
): UpdateCodReconciliationStatusInput => ({
  id,
  data: { status },
})
