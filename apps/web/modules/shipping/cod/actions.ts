import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
  CodCollectionEntry,
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
  const response = await api<
    ApiResponse<PaginatedApiResponse<CodReconciliationBatchApiResponse>>
  >("/admin/shipping/cod/reconciliation", {
    params,
  })

  const page = response.data ?? {}
  const items =
    page.content?.map(normalizeBatch) ?? page.items?.map(normalizeBatch) ?? []

  return {
    ...page,
    content: items,
    items,
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

export const updateCodReconciliationStatus = async ({
  id,
  data,
}: UpdateCodReconciliationStatusInput): Promise<CodReconciliationBatch> => {
  const response = await api<ApiResponse<CodReconciliationBatchApiResponse>>(
    `/admin/shipping/cod/reconciliation/${id}/status`,
    {
      method: "PUT",
      body: data,
    }
  )
  return normalizeBatch(response.data!)
}

export const getCodReconciliationBatch = async (
  id: string
): Promise<CodReconciliationBatch | null> => {
  // Backend has no GET-by-id endpoint — fetch a generous page and locate the
  // batch in the response. Batches per provider are low-cardinality so this
  // remains cheap; if it ever isn't we can add server-side filtering.
  const page = await listCodReconciliationBatches({ page: 0, size: 200 })
  const items = page.content ?? page.items ?? []
  return items.find((batch) => batch.id === id) ?? null
}

export const listCodEntriesByShipment = async (
  shipmentId: string
): Promise<CodCollectionEntry[]> => {
  const response = await api<ApiResponse<CodCollectionEntry[]>>(
    `/admin/shipping/cod/entries/${shipmentId}`
  )
  return response.data ?? []
}
