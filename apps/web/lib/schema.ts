import * as z from "zod"

const phoneRegex = /^(\+963|0)?9\d{8}$/

export const phoneSchema = z.string().regex(phoneRegex, "رقم الهاتف غير صالح")

export const requestOtpSchema = z.object({
  phone: phoneSchema,
})