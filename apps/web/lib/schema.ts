import { isValidPhoneNumber } from "react-phone-number-input"
import * as z from "zod"

export const requiredString = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} مطلوب`)

export const optionalString = () =>
  z.string().trim().optional()

/**
 * Accepts any E.164 international phone number (with leading `+`). Validation
 * is delegated to libphonenumber-js via `react-phone-number-input` so the rule
 * matches the country selected in the UI. The backend stores digits only and
 * normalizes via `PhoneNumbers.toStoredDigits` — sending `+963…` is safe.
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "رقم الهاتف مطلوب")
  .refine((value) => isValidPhoneNumber(value), {
    message: "رقم الهاتف غير صالح",
  })

export const requestOtpSchema = z.object({
  phone: phoneSchema,
})

/**
 * Convert a phone as stored by the backend (digits only — see
 * `PhoneNumbers.toStoredDigits` in SOOQ-Back) back into the canonical E.164
 * form the UI displays (`+963…`). Non-phone principals (Google OAuth emails or
 * `google:<sub>` identifiers stored in `user_account.phone`) pass through
 * untouched.
 */
export const formatStoredPhoneForDisplay = (stored: string): string => {
  if (!stored) return ""
  if (stored.startsWith("+")) return stored
  if (stored.includes("@") || stored.startsWith("google:")) return stored
  if (/^\d{8,15}$/.test(stored)) return `+${stored}`
  return stored
}
