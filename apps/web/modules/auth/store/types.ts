import type * as z from "zod"

import type {
  storeStatusSchema,
  updateStoreRateLimitSchema,
  updateStoreStatusSchema,
} from "./schema"

export type StoreStatus = z.infer<typeof storeStatusSchema>

export type UpdateStoreStatusInput = z.infer<typeof updateStoreStatusSchema>

export type UpdateStoreRateLimitInput = z.infer<typeof updateStoreRateLimitSchema>

export type TenantSummary = {
  tenantId: string
  storeName: string
  slug: string
  storeStatus: StoreStatus
  disabled: boolean
  primaryCurrencyCode?: string
  storeCategory?: string
  requestsPerMinute?: number
  maintenanceMessage?: string | null
}
