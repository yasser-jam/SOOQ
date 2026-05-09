import type { TenantSummary } from "./types"

export const sortTenantsByStatus = (
  tenants: TenantSummary[]
): TenantSummary[] =>
  [...tenants].sort((a, b) => {
    if (a.disabled !== b.disabled) return a.disabled ? 1 : -1
    return a.storeName.localeCompare(b.storeName, "ar")
  })
