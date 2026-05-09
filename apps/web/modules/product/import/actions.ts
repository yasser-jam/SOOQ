import api from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
  ImportBatchDetail,
  ImportBatchSummary,
  ImportPreviewResponse,
} from "./types"

/**
 * POST /api/v1/admin/imports/products?dryRun=
 * Upload CSV/XLSX. dryRun=true validates without persisting.
 */
export const uploadImportFile = async (
  file: File,
  dryRun = false
): Promise<ImportBatchSummary> => {
  const fd = new FormData()
  fd.append("file", file, file.name)
  const search = dryRun ? "?dryRun=true" : ""
  const response = await api<ApiResponse<ImportBatchSummary>>(
    `/admin/imports/products${search}`,
    {
      method: "POST",
      body: fd,
    }
  )
  if (!response.data) {
    throw new Error("Empty response from import upload")
  }
  return response.data
}

/**
 * POST /api/v1/admin/imports/products/preview
 * Parse file and return detected columns + per-row validation results
 * WITHOUT creating a batch row. Useful for showing a confirmation screen.
 */
export const previewImportFile = async (
  file: File
): Promise<ImportPreviewResponse> => {
  const fd = new FormData()
  fd.append("file", file, file.name)
  const response = await api<ApiResponse<ImportPreviewResponse>>(
    "/admin/imports/products/preview",
    {
      method: "POST",
      body: fd,
    }
  )
  if (!response.data) {
    throw new Error("Empty response from import preview")
  }
  return response.data
}

/**
 * GET /api/v1/admin/imports/products/{batchId}
 */
export const getImportBatch = async (
  batchId: string
): Promise<ImportBatchDetail> => {
  const response = await api<ApiResponse<ImportBatchDetail>>(
    `/admin/imports/products/${batchId}`
  )
  if (!response.data) {
    throw new Error(`Import batch ${batchId} not found`)
  }
  return response.data
}

/**
 * GET /api/v1/admin/imports/products?page=&size=
 */
export const listImportBatches = async (
  params: { page?: number; size?: number } = {}
): Promise<ImportBatchSummary[]> => {
  const page = params.page ?? 0
  const size = params.size ?? 20
  const response = await api<ApiResponse<ImportBatchSummary[]>>(
    `/admin/imports/products?page=${page}&size=${size}`
  )
  return response.data ?? []
}
