import type {
  AllSettingsInput,
  BusinessHourDto,
  CurrencySymbolPosition,
  DayOfWeek,
  NumeralSystem,
  SocialLinkDto,
  StoreSettingsResponseDto,
  UpdateStoreSettingsInput,
} from "./types"

export const DEFAULT_TIMEZONE = "Asia/Damascus"

export const DEFAULT_CURRENCY_SYMBOL_POSITION: CurrencySymbolPosition = "AFTER"
export const DEFAULT_NUMERAL_SYSTEM: NumeralSystem = "ARABIC"
export const DEFAULT_CURRENCY_DECIMAL_PLACES = 0

const DAYS_OF_WEEK: readonly DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const

export const DAY_LABELS_AR: Record<DayOfWeek, string> = {
  MONDAY: "الإثنين",
  TUESDAY: "الثلاثاء",
  WEDNESDAY: "الأربعاء",
  THURSDAY: "الخميس",
  FRIDAY: "الجمعة",
  SATURDAY: "السبت",
  SUNDAY: "الأحد",
}

export const PREFERRED_TIMEZONES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "Asia/Damascus", label: "دمشق (Asia/Damascus)" },
  { value: "Asia/Beirut", label: "بيروت (Asia/Beirut)" },
  { value: "Asia/Amman", label: "عمّان (Asia/Amman)" },
  { value: "Asia/Baghdad", label: "بغداد (Asia/Baghdad)" },
  { value: "Asia/Riyadh", label: "الرياض (Asia/Riyadh)" },
  { value: "Asia/Dubai", label: "دبي (Asia/Dubai)" },
  { value: "Asia/Qatar", label: "الدوحة (Asia/Qatar)" },
  { value: "Asia/Kuwait", label: "الكويت (Asia/Kuwait)" },
  { value: "Africa/Cairo", label: "القاهرة (Africa/Cairo)" },
  { value: "Africa/Khartoum", label: "الخرطوم (Africa/Khartoum)" },
  { value: "Africa/Algiers", label: "الجزائر (Africa/Algiers)" },
  { value: "Africa/Tunis", label: "تونس (Africa/Tunis)" },
  { value: "Africa/Casablanca", label: "الدار البيضاء (Africa/Casablanca)" },
  { value: "Europe/Istanbul", label: "إسطنبول (Europe/Istanbul)" },
  { value: "UTC", label: "UTC" },
]

export const SOCIAL_PLATFORMS: ReadonlyArray<{
  value: string
  label: string
  icon: string
}> = [
  { value: "instagram", label: "Instagram", icon: "instagram" },
  { value: "facebook", label: "Facebook", icon: "facebook" },
  { value: "twitter", label: "Twitter / X", icon: "twitter" },
  { value: "whatsapp", label: "WhatsApp", icon: "whatsapp" },
  { value: "telegram", label: "Telegram", icon: "telegram" },
  { value: "youtube", label: "YouTube", icon: "youtube" },
  { value: "tiktok", label: "TikTok", icon: "tiktok" },
  { value: "linkedin", label: "LinkedIn", icon: "linkedin" },
  { value: "website", label: "Website", icon: "globe" },
]

const defaultBusinessHours = (): BusinessHourDto[] =>
  DAYS_OF_WEEK.map((day) => ({
    day,
    open: day !== "FRIDAY",
    opensAt: day !== "FRIDAY" ? "09:00" : null,
    closesAt: day !== "FRIDAY" ? "17:00" : null,
  }))

const ensureBusinessHours = (
  hours?: BusinessHourDto[] | null
): BusinessHourDto[] => {
  const defaults = defaultBusinessHours()
  if (!hours || hours.length === 0) return defaults
  const byDay = new Map(hours.map((h) => [h.day, h]))
  return defaults.map((d) => byDay.get(d.day) ?? d)
}

const ensureSocialLinks = (
  links?: SocialLinkDto[] | null
): SocialLinkDto[] => links ?? []

const buildGeneralDefaults = (settings?: StoreSettingsResponseDto) => ({
  profileNameAr: settings?.profileNameAr ?? "",
  profileNameEn: settings?.profileNameEn ?? "",
  profileDescription: settings?.profileDescription ?? "",
  contactEmail: settings?.contactEmail ?? "",
  contactPhone: settings?.contactPhone ?? "",
})

const buildAddressDefaults = (settings?: StoreSettingsResponseDto) => ({
  governorate: settings?.governorate ?? "",
  city: settings?.city ?? "",
  street: settings?.street ?? "",
  latitude: settings?.latitude ?? null,
  longitude: settings?.longitude ?? null,
})

const buildBrandingDefaults = (settings?: StoreSettingsResponseDto) => ({
  logoUrl: settings?.logoUrl ?? "",
  faviconUrl: settings?.faviconUrl ?? "",
})

const buildCurrencyDefaults = (settings?: StoreSettingsResponseDto) => ({
  currencySymbolPosition:
    settings?.currencySymbolPosition ?? DEFAULT_CURRENCY_SYMBOL_POSITION,
  currencyDecimalPlaces:
    settings?.currencyDecimalPlaces ?? DEFAULT_CURRENCY_DECIMAL_PLACES,
  numeralSystem: settings?.numeralSystem ?? DEFAULT_NUMERAL_SYSTEM,
})

const buildLocaleDefaults = (settings?: StoreSettingsResponseDto) => ({
  timezone: settings?.timezone ?? DEFAULT_TIMEZONE,
})

/**
 * Initial values for the unified settings form. `fallbackContactPhone`
 * (optional) prefills `contactPhone` from the merchant's OTP-verified
 * phone when the server has no contact phone yet — see the
 * GeneralTab notes / OTP onboarding flow.
 */
export const buildAllSettingsDefaults = (
  settings: StoreSettingsResponseDto,
  fallbackContactPhone?: string | null
): AllSettingsInput => {
  const general = buildGeneralDefaults(settings)
  const address = buildAddressDefaults(settings)
  const branding = buildBrandingDefaults(settings)
  const currency = buildCurrencyDefaults(settings)
  const locale = buildLocaleDefaults(settings)
  const contactPhone =
    general.contactPhone || (fallbackContactPhone ?? "")
  return {
    // Identity — these mirror the `tenant` row, surfaced on the
    // settings response.
    storeName: settings.storeName ?? "",
    slug: settings.slug ?? "",
    primaryCurrencyCode: settings.primaryCurrencyCode ?? "SYP",
    // General
    profileNameAr: general.profileNameAr,
    profileNameEn: general.profileNameEn,
    profileDescription: general.profileDescription,
    contactEmail: general.contactEmail,
    contactPhone,
    // Address + map
    governorate: address.governorate,
    city: address.city,
    street: address.street,
    latitude: address.latitude,
    longitude: address.longitude,
    // Branding
    logoUrl: branding.logoUrl,
    faviconUrl: branding.faviconUrl,
    // Currency display
    currencySymbolPosition: currency.currencySymbolPosition,
    currencyDecimalPlaces: currency.currencyDecimalPlaces,
    numeralSystem: currency.numeralSystem,
    // Locale
    timezone: locale.timezone,
    // Field arrays
    socialLinks: ensureSocialLinks(settings.socialLinks),
    businessHours: ensureBusinessHours(settings.businessHours),
  }
}

const stringChanged = (next: string | undefined, prev: string): boolean =>
  (next ?? "") !== prev

/**
 * Computes the minimal payload the merchant actually changed. Field
 * arrays (socialLinks / businessHours) are diffed by JSON equality —
 * cheap and correct given the bounded sizes.
 */
export const diffSettingsPayload = (
  values: AllSettingsInput,
  settings: StoreSettingsResponseDto
): UpdateStoreSettingsInput => {
  const initial = buildAllSettingsDefaults(settings)
  const payload: UpdateStoreSettingsInput = {}

  // Identity
  if (stringChanged(values.storeName, initial.storeName!))
    payload.storeName = values.storeName ?? ""
  if (stringChanged(values.slug, initial.slug!))
    payload.slug = values.slug ?? ""
  if (stringChanged(values.primaryCurrencyCode, initial.primaryCurrencyCode!))
    payload.primaryCurrencyCode = values.primaryCurrencyCode ?? ""

  // General
  if (stringChanged(values.profileNameAr, initial.profileNameAr!))
    payload.profileNameAr = values.profileNameAr ?? ""
  if (stringChanged(values.profileNameEn, initial.profileNameEn!))
    payload.profileNameEn = values.profileNameEn ?? ""
  if (stringChanged(values.profileDescription, initial.profileDescription!))
    payload.profileDescription = values.profileDescription ?? ""
  if (stringChanged(values.contactEmail, initial.contactEmail!))
    payload.contactEmail = values.contactEmail ?? ""
  if (stringChanged(values.contactPhone, initial.contactPhone!))
    payload.contactPhone = values.contactPhone ?? ""

  // Address
  if (stringChanged(values.governorate, initial.governorate!))
    payload.governorate = values.governorate ?? ""
  if (stringChanged(values.city, initial.city!))
    payload.city = values.city ?? ""
  if (stringChanged(values.street, initial.street!))
    payload.street = values.street ?? ""

  // Lat/lng — paired
  const latChanged = (values.latitude ?? null) !== (initial.latitude ?? null)
  const lngChanged = (values.longitude ?? null) !== (initial.longitude ?? null)
  if (latChanged || lngChanged) {
    payload.latitude = values.latitude ?? null
    payload.longitude = values.longitude ?? null
  }

  // Branding
  if (stringChanged(values.logoUrl, initial.logoUrl!))
    payload.logoUrl = values.logoUrl ?? ""
  if (stringChanged(values.faviconUrl, initial.faviconUrl!))
    payload.faviconUrl = values.faviconUrl ?? ""

  // Currency display
  if (values.currencySymbolPosition !== initial.currencySymbolPosition)
    payload.currencySymbolPosition = values.currencySymbolPosition
  if (values.currencyDecimalPlaces !== initial.currencyDecimalPlaces)
    payload.currencyDecimalPlaces = values.currencyDecimalPlaces
  if (values.numeralSystem !== initial.numeralSystem)
    payload.numeralSystem = values.numeralSystem

  // Locale
  if (values.timezone !== initial.timezone)
    payload.timezone = values.timezone

  // Field arrays — JSON deep compare; normalise business hours so a
  // closed day always sends opensAt/closesAt as null (matching the
  // pre-refactor BusinessHoursTab behaviour).
  const normalizedHours: BusinessHourDto[] = values.businessHours.map((h) =>
    h.open
      ? {
          day: h.day,
          open: true,
          opensAt: h.opensAt ?? null,
          closesAt: h.closesAt ?? null,
        }
      : { day: h.day, open: false, opensAt: null, closesAt: null }
  )
  if (JSON.stringify(normalizedHours) !== JSON.stringify(initial.businessHours)) {
    payload.businessHours = normalizedHours
  }
  if (
    JSON.stringify(values.socialLinks) !== JSON.stringify(initial.socialLinks)
  ) {
    payload.socialLinks = values.socialLinks
  }

  return payload
}
