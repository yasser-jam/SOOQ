import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"

import type { AuditLogEntry, AuditLogFilters, PagedResponse } from "./types"

export const auditKeys = {
  all: ["platform", "audit"] as const,
  list: (filters: AuditLogFilters) => [...auditKeys.all, filters] as const,
}

type Envelope<T> = {
  success: boolean
  data?: T
  message?: string
}

const buildQueryString = (filters: AuditLogFilters): string => {
  const params = new URLSearchParams()
  if (filters.action?.trim()) params.set("action", filters.action.trim())
  if (filters.actorUserId?.trim())
    params.set("actorUserId", filters.actorUserId.trim())
  if (filters.from?.trim()) params.set("from", filters.from.trim())
  if (filters.to?.trim()) params.set("to", filters.to.trim())
  params.set("page", String(filters.page ?? 0))
  params.set("size", String(filters.size ?? 20))
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

const normalizePaged = (raw: unknown): PagedResponse<AuditLogEntry> => {
  if (Array.isArray(raw)) {
    return {
      content: raw as AuditLogEntry[],
      totalElements: raw.length,
      totalPages: 1,
      number: 0,
      size: raw.length,
    }
  }
  const obj = raw as Partial<PagedResponse<AuditLogEntry>>
  return {
    content: obj.content ?? [],
    totalElements: obj.totalElements ?? obj.content?.length ?? 0,
    totalPages: obj.totalPages ?? 1,
    number: obj.number ?? 0,
    size: obj.size ?? obj.content?.length ?? 0,
  }
}

export const listAuditLogs = async (
  filters: AuditLogFilters
): Promise<PagedResponse<AuditLogEntry>> => {
  const response = await api<Envelope<unknown>>(
    `/auth/audit-logs${buildQueryString(filters)}`
  )
  return normalizePaged(response.data)
}

export const listAuditLogsQueryOptions = (filters: AuditLogFilters) =>
  queryOptions({
    queryKey: auditKeys.list(filters),
    queryFn: () => listAuditLogs(filters),
  })
