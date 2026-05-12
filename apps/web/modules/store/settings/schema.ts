import * as z from "zod"

import { optionalString } from "@/lib/schema"

export const currencySymbolPositionSchema = z.enum(["BEFORE", "AFTER"])
export const numeralSystemSchema = z.enum(["ARABIC", "LATIN"])

export const dayOfWeekSchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
])

const urlSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https?:\/\//.test(value), {
    message: "الرابط يجب أن يبدأ بـ http:// أو https://",
  })

const contactPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\s+/g, ""))
  .refine((value) => value === "" || /^\+?\d{7,20}$/.test(value), {
    message: "رقم الهاتف غير صالح",
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
  contactEmail: z
    .string()
    .trim()
    .refine((value) => value === "" || /.+@.+\..+/.test(value), {
      message: "بريد إلكتروني غير صالح",
    })
    .optional(),
  contactPhone: contactPhoneSchema.optional(),
})

export const addressSettingsSchema = z.object({
  governorate: optionalString(),
  city: optionalString(),
  street: optionalString(),
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

export const updateStoreSettingsSchema = z.object({
  profileNameAr: z.string().trim().optional(),
  profileNameEn: z.string().trim().optional(),
  profileDescription: z.string().trim().optional(),
  contactEmail: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  governorate: z.string().trim().optional(),
  city: z.string().trim().optional(),
  street: z.string().trim().optional(),
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
