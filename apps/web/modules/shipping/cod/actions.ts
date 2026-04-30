import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
  CodReconciliationBatch,
  CreateCodReconciliationBatchPayload,
  ListCodReconciliationBatchesParams,
  PaginatedApiResponse,
  UpdateCodReconciliationStatusInput,
} from "./types"

type CodReconciliationBatchApiResponse = CodReconciliationBatch & {
  batchId: string
}

const normalizeBatch = (batch: CodReconciliationBatchApiResponse): CodReconciliationBatch => ({
  ...batch,
  id: batch.batchId,
})

export const listCodReconciliationBatches = async (
  params: ListCodReconciliationBatchesParams = {}
): Promise<PaginatedApiResponse<CodReconciliationBatch>> => {
  const response = await api<ApiResponse<PaginatedApiResponse<CodReconciliationBatchApiResponse>>>(
    "/admin/shipping/cod/reconciliation",
    {
      params,
    }
  )

  const data = response.data ?? {}
  const items = data.items ?? data.content ?? []

  return {
    ...data,
    items: items.map(normalizeBatch),
  }
}

export const createCodReconciliationBatch = async (
  payload: CreateCodReconciliationBatchPayload
): Promise<CodReconciliationBatch> => {
  const response = await api<ApiResponse<CodReconciliationBatchApiResponse>>(
    "/admin/shipping/cod/reconciliation",
    {
      method: "POST",
      body: payload,
    }
  )

  return normalizeBatch(response.data!)
}

export const updateCodReconciliationStatus = ({
  id,
  data,
}: UpdateCodReconciliationStatusInput): Promise<void> =>
  api<void>(`/admin/shipping/cod/reconciliation/${id}/status`, {
    method: "PUT",
    body: data,
  })
