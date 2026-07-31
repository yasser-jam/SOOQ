import { createCodReconciliationBatchSchema } from "./schema"
import type {
  CodReconciliationBatchFormValues,
  CodSettlementStatus,
  CreateCodReconciliationBatchPayload,
  UpdateCodReconciliationStatusInput,
} from "./types"

const DEFAULT_PROVIDER_FEE_PERCENTAGE = 5

const pad = (n: number) => String(n).padStart(2, "0")

/** Local calendar day as `YYYY-MM-DD` (avoids UTC shift from toISOString). */
export const toLocalDateInput = (date = new Date()): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** Normalize picker/API values to date-only `YYYY-MM-DD`. */
export const toSettlementDate = (value: string): string => value.slice(0, 10)

/**
 * Form defaults. A function rather than a constant because the settlement date
 * defaults to *today*, which must be resolved when the form mounts.
 */
export const initCodReconciliationBatchFormValues =
  (): CodReconciliationBatchFormValues => ({
    shippingProviderId: "",
    providerFeePercentage: DEFAULT_PROVIDER_FEE_PERCENTAGE,
    settlementDate: toLocalDateInput(),
    notes: "",
  })

export const buildCreateCodReconciliationBatchPayload = (
  rawValues: CodReconciliationBatchFormValues
): CreateCodReconciliationBatchPayload => {
  const values = createCodReconciliationBatchSchema.parse(rawValues)

  return {
    ...values,
    settlementDate: toSettlementDate(values.settlementDate),
    notes: values.notes?.trim() ? values.notes.trim() : undefined,
  }
}

export const initCodReconciliationStatusUpdate = (
  id: string,
  status: CodSettlementStatus
): UpdateCodReconciliationStatusInput => ({
  id,
  data: { status },
})
