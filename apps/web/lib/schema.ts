import { isPossiblePhoneNumber } from "react-phone-number-input"
import * as z from "zod"

export const requiredString = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} مطلوب`)

export const optionalString = () =>
  z.string().trim().optional()

/**
 * Accepts any E.164 international phone number (with leading `+`). Validation
 * uses `isPossiblePhoneNumber` (lenient) rather than `isValidPhoneNumber`
 * (strict) — we only enforce a plausible length per country code, not the
 * full national-prefix rules, because the backend is the authority on phone
 * acceptance and only stores digits (`PhoneNumbers.toStoredDigits`).
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "رقم الهاتف مطلوب")
  .refine((value) => isPossiblePhoneNumber(value), {
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
