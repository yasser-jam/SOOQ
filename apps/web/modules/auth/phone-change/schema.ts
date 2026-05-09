import * as z from "zod"

import { phoneSchema } from "@/lib/schema"

export const requestPhoneChangeSchema = z.object({
  newPhone: phoneSchema,
})

export const verifyPhoneChangeSchema = z.object({
  newPhone: phoneSchema,
  otpCode: z
    .string()
    .trim()
    .length(6, "الرمز يجب أن يكون 6 أرقام")
    .regex(/^\d{6}$/, "أرقام فقط"),
})
