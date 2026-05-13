import * as z from "zod"

import { optionalString, phoneSchema, requiredString } from "@/lib/schema"

import { ROLES } from "./types"

export const roleSchema = z.enum(ROLES)

// Merchant OTP request/verify bodies match `MerchantOtpRequestDto` /
// `MerchantOtpVerifyDto` on the backend — tenant context is conveyed via
// the `X-Tenant-Slug` header (handled in actions.ts), not in the body.
export const requestOtpSchema = z.object({
  phone: phoneSchema,
  fullName: optionalString(),
})

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otpCode: z
    .string()
    .trim()
    .length(6, "الرمز يجب أن يكون 6 أرقام")
    .regex(/^\d{6}$/, "أرقام فقط"),
  totpCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "أرقام فقط")
    .optional()
    .or(z.literal("")),
  backupCode: optionalString(),
})

export const googleOAuthSchema = z.object({
  idToken: requiredString("معرف الدخول"),
  email: optionalString(),
  fullName: optionalString(),
  role: roleSchema.default("OWNER"),
  tenantSlug: optionalString(),
})
