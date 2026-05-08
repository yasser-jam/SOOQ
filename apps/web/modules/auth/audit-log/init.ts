import type { AuditLogFilters } from "./types"

export const auditLogFiltersDefaultValues: AuditLogFilters = {
  action: "",
  actorUserId: "",
  from: "",
  to: "",
  page: 0,
  size: 20,
}

export const isFilterActive = (filters: AuditLogFilters): boolean =>
  Boolean(
    filters.action?.trim() ||
      filters.actorUserId?.trim() ||
      filters.from?.trim() ||
      filters.to?.trim()
  )

export const tryFormatJson = (value: string | null | undefined): string => {
  if (!value) return ""
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}
