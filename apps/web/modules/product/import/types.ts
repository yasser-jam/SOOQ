/**
 * Bulk product import types — mirrors backend
 * SOOQ-Back/.../modules/import_/dto/ProductImportBatchDto and friends.
 */

export type ImportBatchStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "PARTIAL"
  | "DRY_RUN"

export type ImportRowError = {
  rowNumber: number
  field?: string
  message: string
  rowData?: string
}

export type ImportBatchSummary = {
  batchId: string
  fileName?: string
  status: ImportBatchStatus
  totalRows?: number
  successRows?: number
  errorRows?: number
  dryRun?: boolean
  uploadedAt?: string
  completedAt?: string
}

export type ImportBatchDetail = ImportBatchSummary & {
  errors?: ImportRowError[]
  detectedColumns?: string[]
}

export type ImportPreviewResponse = {
  batchId?: string
  totalRows: number
  detectedColumns: string[]
  errors: ImportRowError[]
  /** Sample of valid rows (already parsed). */
  sampleRows?: Record<string, unknown>[]
}
