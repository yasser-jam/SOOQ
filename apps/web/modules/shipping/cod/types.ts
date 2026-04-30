export type CodSettlementStatus = "PENDING" | "SETTLED" | "DISPUTED"

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

export interface PaginatedApiResponse<T> {
  content?: T[]
  items?: T[]
  totalElements?: number
  totalItems?: number
  totalPages?: number
  page?: number
  number?: number
  size?: number
}

export type ListCodReconciliationBatchesParams = {
  page?: number
  size?: number
}

export type CreateCodReconciliationBatchPayload = {
  shippingProviderId: string
  providerFeePercentage: number
  settlementDate: string
  notes?: string
}

export type UpdateCodReconciliationStatusPayload = {
  status: CodSettlementStatus
}

export type UpdateCodReconciliationStatusInput = {
  id: string
  data: UpdateCodReconciliationStatusPayload
}
