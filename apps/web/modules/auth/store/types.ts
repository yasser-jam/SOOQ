import type * as z from "zod"

import type { AuthTokenResponse } from "@/modules/auth/auth/types"

import type {
  createStoreSchema,
  storeStatusSchema,
  updateStoreRateLimitSchema,
  updateStoreStatusSchema,
} from "./schema"

export type StoreStatus = z.infer<typeof storeStatusSchema>

export type CreateStoreInput = z.infer<typeof createStoreSchema>

export type UpdateStoreStatusInput = z.infer<typeof updateStoreStatusSchema>

export type UpdateStoreRateLimitInput = z.infer<typeof updateStoreRateLimitSchema>

export type Store = {
  tenantId: string
  storeName: string
  slug: string
  primaryCurrencyCode: string
  storeCategory: string
  storeStatus: StoreStatus
  disabled: boolean
  themeCode?: string
  maintenanceMessage?: string | null
}

export type StoreRegistrationResponse = {
  store: Store
  auth: AuthTokenResponse | null
}

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
