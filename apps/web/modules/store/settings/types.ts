import type * as z from "zod"

import type {
  allSettingsSchema,
  businessHourSchema,
  identitySchema,
  socialLinkSchema,
  storeDeletionRequestSchema,
  updateStoreSettingsSchema,
} from "./schema"

export type CurrencySymbolPosition = "BEFORE" | "AFTER"
export type NumeralSystem = "ARABIC" | "LATIN"

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY"

export type BusinessHourDto = z.infer<typeof businessHourSchema>
export type SocialLinkDto = z.infer<typeof socialLinkSchema>
export type StoreDeletionRequestDto = z.infer<typeof storeDeletionRequestSchema>
export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>
export type IdentitySettingsInput = z.infer<typeof identitySchema>
export type AllSettingsInput = z.infer<typeof allSettingsSchema>

export type StoreSettingsResponseDto = {
  storeConfigId: string
  tenantId: string

  // Tenant identity fields — mirrored from the `tenant` row by the
  // backend. Sending all three on PUT is what flips
  // `tenant.configured=true` during onboarding (STR.md §"API
  // Endpoints").
  storeName?: string | null
  slug?: string | null
  primaryCurrencyCode?: string | null
  isConfigured?: boolean

  profileNameAr?: string | null
  profileNameEn?: string | null
  profileDescription?: string | null
  contactEmail?: string | null
  contactPhone?: string | null

  governorate?: string | null
  city?: string | null
  street?: string | null
  latitude?: number | null
  longitude?: number | null

  logoUrl?: string | null
  faviconUrl?: string | null

  currencySymbolPosition?: CurrencySymbolPosition | null
  currencyDecimalPlaces?: number | null
  numeralSystem?: NumeralSystem | null
  timezone?: string | null

  socialLinks?: SocialLinkDto[] | null
  businessHours?: BusinessHourDto[] | null

  deletionRequested?: boolean
  deletionRequestedAt?: string | null
  deletionPurgeAt?: string | null

  createdAt?: string
  updatedAt?: string
}

/**
 * Canonical alias for the merchant's store settings shape. Use this
 * in callers that don't care about the `…ResponseDto` framing.
 */
export type StoreSettings = StoreSettingsResponseDto
