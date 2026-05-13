import type * as z from "zod"

import type {
  saveStoreSettingsSchema,
  storeStatusSchema,
  updateStoreRateLimitSchema,
  updateStoreStatusSchema,
} from "./schema"

export type StoreStatus = z.infer<typeof storeStatusSchema>

export type SaveStoreSettingsInput = z.infer<typeof saveStoreSettingsSchema>

export type UpdateStoreStatusInput = z.infer<typeof updateStoreStatusSchema>

export type UpdateStoreRateLimitInput = z.infer<typeof updateStoreRateLimitSchema>

/**
 * Mirrors the STR `StoreSettingsResponseDto` shape (only the fields the
 * frontend currently reads). Returned from `GET /admin/store/settings`
 * and from `PUT /admin/store/settings` after the onboarding identity
 * submit; `isConfigured` is the onboarding gate.
 */
export type StoreSettings = {
  storeConfigId?: string
  tenantId: string
  storeName: string | null
  slug: string | null
  primaryCurrencyCode: string | null
  isConfigured: boolean
  profileNameAr?: string | null
  profileNameEn?: string | null
  profileDescription?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  logoUrl?: string | null
  faviconUrl?: string | null
  timezone?: string | null
  deletionRequested?: boolean
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
