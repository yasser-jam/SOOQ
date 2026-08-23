import type * as z from "zod"

import type {
  storeStatusSchema,
  updateIdentitySchema,
  updateStoreRateLimitSchema,
  updateStoreStatusSchema,
} from "./schema"

export type StoreStatus = z.infer<typeof storeStatusSchema>

export type UpdateStoreStatusInput = z.infer<typeof updateStoreStatusSchema>

export type UpdateStoreRateLimitInput = z.infer<typeof updateStoreRateLimitSchema>

export type UpdateIdentityInput = z.infer<typeof updateIdentitySchema>

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
  logoUrl?: string | null
}

export type SlugAvailability = {
  available: boolean
  slug: string
}

export type UploadedMedia = {
  assetId: string
  url: string
  fileName?: string
}
