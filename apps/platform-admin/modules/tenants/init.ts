import type { TenantSummary } from "./types"

export const sortTenantsByStatus = (tenants: TenantSummary[]): TenantSummary[] =>
  [...tenants].sort((a, b) => {
    if (a.disabled !== b.disabled) return a.disabled ? 1 : -1
    return a.storeName.localeCompare(b.storeName, "ar")
  })

export const STORE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "نشط",
  PAUSED: "متوقف",
  MAINTENANCE: "صيانة",
  PASSWORD_PROTECTED: "محمي بكلمة مرور",
  CLOSED: "مغلق",
}
