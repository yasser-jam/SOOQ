import type {
  CodSettlementStatus,
  CreateCodReconciliationBatchPayload,
  UpdateCodReconciliationStatusInput,
} from "./types"

const pad = (n: number) => String(n).padStart(2, "0")

/** Local calendar day as `YYYY-MM-DD` (avoids UTC shift from toISOString). */
export const toLocalDateInput = (date = new Date()): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** Normalize picker/API values to date-only `YYYY-MM-DD`. */
export const toSettlementDate = (value: string): string => value.slice(0, 10)

export const initCreateCodReconciliationBatch = (
  data: CreateCodReconciliationBatchPayload
): CreateCodReconciliationBatchPayload => ({
  ...data,
  settlementDate: toSettlementDate(data.settlementDate),
  notes: data.notes?.trim() ? data.notes.trim() : undefined,
})

export const initCodReconciliationStatusUpdate = (
  id: string,
  status: CodSettlementStatus
): UpdateCodReconciliationStatusInput => ({
  id,
  data: { status },
})
