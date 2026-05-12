import type * as z from "zod"

import type {
  businessHourSchema,
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

export type StoreSettingsResponseDto = {
  storeConfigId: string
  tenantId: string

  profileNameAr?: string | null
  profileNameEn?: string | null
  profileDescription?: string | null
  contactEmail?: string | null
  contactPhone?: string | null

  governorate?: string | null
  city?: string | null
  street?: string | null

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
