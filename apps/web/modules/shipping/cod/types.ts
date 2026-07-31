import type * as z from "zod"

import type { SettlementStatus } from "@/lib/domain-enums"
import type { Page } from "@/lib/types"

import type { createCodReconciliationBatchSchema } from "./schema"

/** Settlement lifecycle shared with orders/shipments (`lib/domain-enums`). */
export type CodSettlementStatus = SettlementStatus

export type CodReconciliationBatchFormValues = z.input<
  typeof createCodReconciliationBatchSchema
>

export type CreateCodReconciliationBatchPayload = z.output<
  typeof createCodReconciliationBatchSchema
>

export interface CodReconciliationBatch {
  id?: string
  batchId?: string
  shippingProviderId?: string
  providerCode?: string
  providerName?: string
  orderCount?: number
  expectedTotalSyp?: number
  collectedTotalSyp?: number
  providerFeePercentage?: number
  providerFeeAmountSyp?: number
  netSettlementSyp?: number
  settlementStatus?: CodSettlementStatus
  settlementDate?: string
  reconciledByUserId?: string
  reconciledAt?: string
  notes?: string
}

export type CodReconciliationBatchPage = Page<CodReconciliationBatch>

export type ListCodReconciliationBatchesParams = {
  page?: number
  size?: number
  // Filter fields — currently applied client-side because backend
  // GET /admin/shipping/cod/reconciliation accepts only Pageable. When the
  // backend gains @RequestParam support for these the action can forward
  // them as-is without UI changes.
  shippingProviderId?: string
  settlementDateFrom?: string
  settlementDateTo?: string
}

export interface CodReconciliationFilters {
  shippingProviderId?: string
  settlementDateFrom?: string
  settlementDateTo?: string
}

export type UpdateCodReconciliationStatusPayload = {
  status: CodSettlementStatus
}

export type UpdateCodReconciliationStatusInput = {
  id: string
  data: UpdateCodReconciliationStatusPayload
}

export interface CodCollectionEntry {
  codCollectionEntryId?: string
  shipmentId?: string
  paymentTxnId?: string | null
  expectedAmountSyp?: number | null
  collectedAmountSyp?: number | null
  collectedAt?: string | null
}
