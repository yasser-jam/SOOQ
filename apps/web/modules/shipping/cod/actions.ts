import { api } from "@/lib/api"
import { normalizePage } from "@/lib/pagination"
import type { ApiResponse, Page, PagedApiResponse } from "@/lib/types"

import type {
  CodCollectionEntry,
  CodReconciliationBatch,
  CodReconciliationBatchPage,
  CreateCodReconciliationBatchPayload,
  ListCodReconciliationBatchesParams,
  UpdateCodReconciliationStatusInput,
} from "./types"

type CodReconciliationBatchApiModel = CodReconciliationBatch & {
  batchId: string
}

const normalizeBatch = (
  batch: CodReconciliationBatchApiModel
): CodReconciliationBatch => ({
  ...batch,
  id: batch.batchId,
})

export const listCodReconciliationBatches = async (
  params: ListCodReconciliationBatchesParams = {}
): Promise<CodReconciliationBatchPage> => {
  const response = await api<
    | PagedApiResponse<CodReconciliationBatchApiModel>
    | ApiResponse<Page<CodReconciliationBatchApiModel>>
  >("/admin/shipping/cod/reconciliation", {
    params,
  })

  // Real backend: { data: T[], meta }. Mock: { data: { content: T[] } }.
  const pageInput = Array.isArray(response.data)
    ? response
    : (response.data ?? {})

  const normalized = normalizePage(pageInput, params.size ?? 20)

  return {
    content: normalized.items.map(normalizeBatch),
    totalElements: normalized.totalItems,
    totalPages: normalized.totalPages,
    number: normalized.pageIndex,
    size: normalized.pageSize,
    first: !normalized.hasPrev,
    last: !normalized.hasNext,
    empty: normalized.items.length === 0,
  }
}

export const createCodReconciliationBatch = async (
  payload: CreateCodReconciliationBatchPayload
): Promise<CodReconciliationBatch> => {
  const response = await api<ApiResponse<CodReconciliationBatchApiModel>>(
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
  const response = await api<ApiResponse<CodReconciliationBatchApiModel>>(
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

  return page.content?.find((batch) => batch.id === id) ?? null
}

export const listCodEntriesByShipment = async (
  shipmentId: string
): Promise<CodCollectionEntry[]> => {
  const response = await api<ApiResponse<CodCollectionEntry[]>>(
    `/admin/shipping/cod/entries/${shipmentId}`
  )

  return response.data ?? []
}
