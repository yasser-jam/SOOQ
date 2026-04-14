import * as z from "zod"

const phoneRegex = /^\+9639\d{8}$/

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "رقم الهاتف مطلوب")
  .regex(/^\+?\d+$/, "يسمح بالأرقام فقط")
  .refine((value) => value.startsWith("+963"), {
    message: "يجب أن يبدأ بـ +963",
  })
  .refine((value) => phoneRegex.test(value), {
    message: "رقم الهاتف مكون من 10 أرقام",
  })

export const requestOtpSchema = z.object({
  phone: phoneSchema,
})