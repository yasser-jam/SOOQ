import * as z from "zod"

import { optionalString, requiredString } from "@/lib/schema"

export const storeStatusSchema = z.enum([
  "ACTIVE",
  "PAUSED",
  "MAINTENANCE",
  "PASSWORD_PROTECTED",
  "CLOSED",
])

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const currencyRegex = /^[A-Z]{3}$/

// Onboarding identity submit — matches the STR `StoreSettingsUpdateRequestDto`
// fields that flip `tenant.configured=true` when all three are sent
// together (see STR.md §"API Endpoints"). Logo / theme / category live on
// other DTO paths and are added in later iterations.
export const saveStoreSettingsSchema = z.object({
  storeName: requiredString("اسم المتجر"),
  slug: z
    .string()
    .trim()
    .min(1, "الرابط مطلوب")
    .regex(slugRegex, "أحرف لاتينية صغيرة وأرقام مفصولة بشرطة فقط"),
  primaryCurrencyCode: z
    .string()
    .trim()
    .regex(currencyRegex, "رمز عملة من 3 أحرف لاتينية كبيرة"),
})

export const updateStoreStatusSchema = z
  .object({
    status: storeStatusSchema,
    maintenanceMessage: optionalString(),
    storePassword: z
      .string()
      .trim()
      .min(4, "كلمة المرور يجب أن تكون 4 أحرف على الأقل")
      .max(100, "كلمة المرور طويلة جداً")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.status === "PASSWORD_PROTECTED") {
      const trimmed = data.storePassword?.trim() ?? ""
      if (trimmed.length < 4) {
        ctx.addIssue({
          code: "custom",
          path: ["storePassword"],
          message: "كلمة المرور مطلوبة لهذه الحالة",
        })
      }
    }
  })

export const updateStoreRateLimitSchema = z.object({
  requestsPerMinute: z.coerce
    .number()
    .int("قيمة صحيحة فقط")
    .min(1, "أقل قيمة 1")
    .max(10000, "أعلى قيمة 10000"),
})
