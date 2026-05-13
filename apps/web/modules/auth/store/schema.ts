import * as z from "zod"

import { optionalString } from "@/lib/schema"

export const storeStatusSchema = z.enum([
  "ACTIVE",
  "PAUSED",
  "MAINTENANCE",
  "PASSWORD_PROTECTED",
  "CLOSED",
])

// The onboarding identity schema now lives in modules/store/settings/schema.ts
// (re-exported as `identitySchema`) since it submits via the STR settings
// endpoint. The wizard imports from there directly.

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
