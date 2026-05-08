import * as z from "zod"

import { optionalString, phoneSchema, requiredString } from "@/lib/schema"

export const requestCustomerOtpSchema = z.object({
  phone: phoneSchema,
  tenantSlug: requiredString("معرّف المتجر"),
  fullName: optionalString(),
})

export const verifyCustomerOtpSchema = z.object({
  phone: phoneSchema,
  tenantSlug: requiredString("معرّف المتجر"),
  otpCode: z
    .string()
    .trim()
    .length(6, "الرمز يجب أن يكون 6 أرقام")
    .regex(/^\d{6}$/, "أرقام فقط"),
  totpCode: optionalString(),
  backupCode: optionalString(),
})
