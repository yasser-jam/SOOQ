import type {
  BusinessHourDto,
  CurrencySymbolPosition,
  DayOfWeek,
  NumeralSystem,
  SocialLinkDto,
  StoreSettingsResponseDto,
} from "./types"

export const DEFAULT_TIMEZONE = "Asia/Damascus"

export const DEFAULT_CURRENCY_SYMBOL_POSITION: CurrencySymbolPosition = "AFTER"
export const DEFAULT_NUMERAL_SYSTEM: NumeralSystem = "ARABIC"
export const DEFAULT_CURRENCY_DECIMAL_PLACES = 0

export const DAYS_OF_WEEK: readonly DayOfWeek[] = [
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

export const TIMEZONE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
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

export const defaultBusinessHours = (): BusinessHourDto[] =>
  DAYS_OF_WEEK.map((day) => ({
    day,
    open: day !== "FRIDAY",
    opensAt: day !== "FRIDAY" ? "09:00" : null,
    closesAt: day !== "FRIDAY" ? "17:00" : null,
  }))

export const ensureBusinessHours = (
  hours?: BusinessHourDto[] | null
): BusinessHourDto[] => {
  const defaults = defaultBusinessHours()
  if (!hours || hours.length === 0) return defaults
  const byDay = new Map(hours.map((h) => [h.day, h]))
  return defaults.map((d) => byDay.get(d.day) ?? d)
}

export const ensureSocialLinks = (
  links?: SocialLinkDto[] | null
): SocialLinkDto[] => links ?? []

export const buildGeneralDefaults = (settings?: StoreSettingsResponseDto) => ({
  profileNameAr: settings?.profileNameAr ?? "",
  profileNameEn: settings?.profileNameEn ?? "",
  profileDescription: settings?.profileDescription ?? "",
  contactEmail: settings?.contactEmail ?? "",
  contactPhone: settings?.contactPhone ?? "",
})

export const buildAddressDefaults = (settings?: StoreSettingsResponseDto) => ({
  governorate: settings?.governorate ?? "",
  city: settings?.city ?? "",
  street: settings?.street ?? "",
})

export const buildBrandingDefaults = (settings?: StoreSettingsResponseDto) => ({
  logoUrl: settings?.logoUrl ?? "",
  faviconUrl: settings?.faviconUrl ?? "",
})

export const buildCurrencyDefaults = (settings?: StoreSettingsResponseDto) => ({
  currencySymbolPosition:
    settings?.currencySymbolPosition ?? DEFAULT_CURRENCY_SYMBOL_POSITION,
  currencyDecimalPlaces:
    settings?.currencyDecimalPlaces ?? DEFAULT_CURRENCY_DECIMAL_PLACES,
  numeralSystem: settings?.numeralSystem ?? DEFAULT_NUMERAL_SYSTEM,
})

export const buildLocaleDefaults = (settings?: StoreSettingsResponseDto) => ({
  timezone: settings?.timezone ?? DEFAULT_TIMEZONE,
})
