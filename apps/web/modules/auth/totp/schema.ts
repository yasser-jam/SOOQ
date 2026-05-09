import * as z from "zod"

export const enableTotpSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, "الرمز يجب أن يكون 6 أرقام")
    .regex(/^\d{6}$/, "أرقام فقط"),
})
