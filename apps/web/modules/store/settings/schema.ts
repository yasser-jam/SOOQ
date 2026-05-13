import * as z from "zod"

import { optionalString, requiredString } from "@/lib/schema"

export const currencySymbolPositionSchema = z.enum(["BEFORE", "AFTER"])
export const numeralSystemSchema = z.enum(["ARABIC", "LATIN"])

// Slug regex shared with the onboarding wizard: lowercase + digits with
// single-dash separators. Server-side validation is the source of truth
// (`StoreSettingsUpdateRequestDto.slug` @Pattern), this just gates the
// client form before submit.
export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const currencyCodeRegex = /^[A-Z]{3}$/

export const dayOfWeekSchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
])

export const urlSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https?:\/\//.test(value), {
    message: "الرابط يجب أن يبدأ بـ http:// أو https://",
  })

export const contactPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\s+/g, ""))
  .refine((value) => value === "" || /^\+?\d{7,20}$/.test(value), {
    message: "رقم الهاتف غير صالح",
  })

export const contactEmailSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || /.+@.+\..+/.test(value), {
    message: "بريد إلكتروني غير صالح",
  })

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "الصيغة: HH:mm")

export const socialLinkSchema = z.object({
  label: z.string().trim().min(1, "التسمية مطلوبة"),
  url: z
    .string()
    .trim()
    .min(1, "الرابط مطلوب")
    .refine((value) => /^https?:\/\//.test(value), {
      message: "الرابط يجب أن يبدأ بـ http:// أو https://",
    }),
  platform: z.string().trim().min(1, "المنصة مطلوبة"),
  icon: z.string().trim().min(1, "الأيقونة مطلوبة"),
})

export const businessHourSchema = z
  .object({
    day: dayOfWeekSchema,
    open: z.boolean(),
    opensAt: z.union([timeSchema, z.null()]).optional(),
    closesAt: z.union([timeSchema, z.null()]).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.open) return
    if (!data.opensAt) {
      ctx.addIssue({
        code: "custom",
        path: ["opensAt"],
        message: "وقت الفتح مطلوب",
      })
    }
    if (!data.closesAt) {
      ctx.addIssue({
        code: "custom",
        path: ["closesAt"],
        message: "وقت الإغلاق مطلوب",
      })
    }
    if (data.opensAt && data.closesAt && data.opensAt >= data.closesAt) {
      ctx.addIssue({
        code: "custom",
        path: ["closesAt"],
        message: "وقت الإغلاق يجب أن يكون بعد وقت الفتح",
      })
    }
  })

export const generalSettingsSchema = z.object({
  profileNameAr: optionalString(),
  profileNameEn: optionalString(),
  profileDescription: optionalString(),
  contactEmail: contactEmailSchema.optional(),
  contactPhone: contactPhoneSchema.optional(),
})

// Coordinates are nullable but paired — both must be present or both
// absent. Mirrors the backend `chk_store_config_coords_paired` check
// constraint added in V32.
const coordinateSchema = z
  .number()
  .nullable()
  .optional()
const latitudeSchema = coordinateSchema.refine(
  (value) => value == null || (value >= -90 && value <= 90),
  { message: "خط العرض يجب أن يكون بين -90 و 90" }
)
const longitudeSchema = coordinateSchema.refine(
  (value) => value == null || (value >= -180 && value <= 180),
  { message: "خط الطول يجب أن يكون بين -180 و 180" }
)

export const addressSettingsSchema = z
  .object({
    governorate: optionalString(),
    city: optionalString(),
    street: optionalString(),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
  })
  .superRefine((data, ctx) => {
    const latitudeSet = data.latitude != null
    const longitudeSet = data.longitude != null
    if (latitudeSet !== longitudeSet) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "اختر موقعاً على الخريطة لتعيين الإحداثيات الكاملة",
      })
    }
  })

export const brandingSettingsSchema = z.object({
  logoUrl: urlSchema.optional(),
  faviconUrl: urlSchema.optional(),
})

export const currencySettingsSchema = z.object({
  currencySymbolPosition: currencySymbolPositionSchema,
  currencyDecimalPlaces: z.coerce
    .number()
    .int("قيمة صحيحة فقط")
    .min(0, "أقل قيمة 0")
    .max(4, "أعلى قيمة 4"),
  numeralSystem: numeralSystemSchema,
})

export const localeSettingsSchema = z.object({
  timezone: z.string().trim().min(1, "المنطقة الزمنية مطلوبة"),
})

export const socialLinksSettingsSchema = z.object({
  socialLinks: z.array(socialLinkSchema),
})

export const businessHoursSettingsSchema = z
  .object({
    businessHours: z.array(businessHourSchema),
  })
  .superRefine((data, ctx) => {
    const days = new Set<string>()
    data.businessHours.forEach((entry, idx) => {
      if (days.has(entry.day)) {
        ctx.addIssue({
          code: "custom",
          path: ["businessHours", idx, "day"],
          message: "اليوم مكرر",
        })
      }
      days.add(entry.day)
    })
  })

// Identity tab — merchant edits the three fields that the onboarding
// wizard captured. Sending all three together flips
// `tenant.configured=true` (idempotent after the first time).
export const identitySchema = z.object({
  storeName: requiredString("اسم المتجر"),
  slug: z
    .string()
    .trim()
    .min(1, "الرابط مطلوب")
    .regex(slugRegex, "أحرف لاتينية صغيرة وأرقام مفصولة بشرطة فقط"),
  primaryCurrencyCode: z
    .string()
    .trim()
    .regex(currencyCodeRegex, "رمز عملة من 3 أحرف لاتينية كبيرة"),
})

export const updateStoreSettingsSchema = z.object({
  storeName: z.string().trim().optional(),
  slug: z
    .string()
    .trim()
    .regex(slugRegex, "أحرف لاتينية صغيرة وأرقام مفصولة بشرطة فقط")
    .optional(),
  primaryCurrencyCode: z
    .string()
    .trim()
    .regex(currencyCodeRegex, "رمز عملة من 3 أحرف لاتينية كبيرة")
    .optional(),
  profileNameAr: z.string().trim().optional(),
  profileNameEn: z.string().trim().optional(),
  profileDescription: z.string().trim().optional(),
  contactEmail: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  governorate: z.string().trim().optional(),
  city: z.string().trim().optional(),
  street: z.string().trim().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  logoUrl: z.string().trim().optional(),
  faviconUrl: z.string().trim().optional(),
  currencySymbolPosition: currencySymbolPositionSchema.optional(),
  currencyDecimalPlaces: z.number().int().min(0).max(4).optional(),
  numeralSystem: numeralSystemSchema.optional(),
  timezone: z.string().trim().optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
  businessHours: z.array(businessHourSchema).optional(),
})

export const storeDeletionRequestSchema = z.object({
  reason: z.string().trim().optional(),
  graceDays: z.coerce
    .number()
    .int("قيمة صحيحة فقط")
    .min(1, "أقل قيمة 1")
    .max(60, "أعلى قيمة 60")
    .optional(),
})

// Unified schema for the page-level "save all" flow. Mirrors the
// field-level rules of every per-tab schema, plus the cross-field
// refines (lat/lng paired, business hours day uniqueness). The per-tab
// sub-schemas above are kept for the onboarding wizard (`identitySchema`)
// and for any future module that needs a narrow validator.
export const allSettingsSchema = z
  .object({
    // Identity
    storeName: optionalString(),
    slug: z.string().trim().optional(),
    primaryCurrencyCode: z.string().trim().optional(),

    // General
    profileNameAr: optionalString(),
    profileNameEn: optionalString(),
    profileDescription: optionalString(),
    contactEmail: contactEmailSchema.optional(),
    contactPhone: contactPhoneSchema.optional(),

    // Address
    governorate: optionalString(),
    city: optionalString(),
    street: optionalString(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),

    // Branding
    logoUrl: urlSchema.optional(),
    faviconUrl: urlSchema.optional(),

    // Currency display
    currencySymbolPosition: currencySymbolPositionSchema,
    currencyDecimalPlaces: z
      .number()
      .int("قيمة صحيحة فقط")
      .min(0, "أقل قيمة 0")
      .max(4, "أعلى قيمة 4"),
    numeralSystem: numeralSystemSchema,

    // Locale
    timezone: z.string().trim().min(1, "المنطقة الزمنية مطلوبة"),

    // Field arrays
    socialLinks: z.array(socialLinkSchema),
    businessHours: z.array(businessHourSchema),
  })
  .superRefine((data, ctx) => {
    if (data.slug && !slugRegex.test(data.slug)) {
      ctx.addIssue({
        code: "custom",
        path: ["slug"],
        message: "أحرف لاتينية صغيرة وأرقام مفصولة بشرطة فقط",
      })
    }
    if (
      data.primaryCurrencyCode &&
      !/^[A-Z]{3}$/.test(data.primaryCurrencyCode)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["primaryCurrencyCode"],
        message: "رمز عملة من 3 أحرف لاتينية كبيرة",
      })
    }
    const latitudeSet = data.latitude != null
    const longitudeSet = data.longitude != null
    if (latitudeSet !== longitudeSet) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "اختر موقعاً على الخريطة لتعيين الإحداثيات الكاملة",
      })
    }
    if (data.latitude != null && (data.latitude < -90 || data.latitude > 90)) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "خط العرض يجب أن يكون بين -90 و 90",
      })
    }
    if (
      data.longitude != null &&
      (data.longitude < -180 || data.longitude > 180)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["longitude"],
        message: "خط الطول يجب أن يكون بين -180 و 180",
      })
    }
    const days = new Set<string>()
    data.businessHours.forEach((entry, idx) => {
      if (days.has(entry.day)) {
        ctx.addIssue({
          code: "custom",
          path: ["businessHours", idx, "day"],
          message: "اليوم مكرر",
        })
      }
      days.add(entry.day)
    })
  })
