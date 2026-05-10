import * as z from "zod"

export const requiredString = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} مطلوب`)

export const optionalString = () =>
  z.string().trim().optional()

/**
 * Accepts any E.164-shaped international phone number: leading `+` and 7–15
 * digits (per the ITU E.164 spec range). No per-country length or
 * national-prefix checks — the backend is the authority on phone acceptance
 * and stores digits only via `PhoneNumbers.toStoredDigits`.
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "رقم الهاتف مطلوب")
  .transform((value) => value.replace(/\s+/g, ""))
  .refine((value) => /^\+\d{7,15}$/.test(value), {
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
