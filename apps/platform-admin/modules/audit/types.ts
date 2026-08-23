import type * as z from "zod"

import type { auditLogFiltersSchema } from "./schema"

export type AuditLogEntry = {
  auditId: string
  tenantId: string
  actorUserId: string
  entityType: string
  entityId: string
  action: string
  oldValue?: string | null
  newValue?: string | null
  createdAt?: string | null
}

export type AuditLogFilters = z.infer<typeof auditLogFiltersSchema>

export type PagedResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
