import * as z from "zod"

export const requiredString = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} مطلوب`)

export const optionalString = () => z.string().trim().optional()

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "رقم الهاتف مطلوب")
  .transform((value) => value.replace(/\s+/g, ""))
  .refine((value) => /^\+\d{7,15}$/.test(value), {
    message: "رقم الهاتف غير صالح",
  })

export const formatStoredPhoneForDisplay = (stored: string): string => {
  if (!stored) return ""
  if (stored.startsWith("+")) return stored
  if (/^\d{8,15}$/.test(stored)) return `+${stored}`
  return stored
}
