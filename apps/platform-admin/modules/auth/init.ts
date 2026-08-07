import type { VerifyOtpInput } from "./types"

export const cleanVerifyOtpPayload = (input: VerifyOtpInput): VerifyOtpInput => ({
  phone: input.phone.trim(),
  otpCode: input.otpCode.trim(),
  totpCode: input.totpCode?.trim() || undefined,
  backupCode: input.backupCode?.trim() || undefined,
})
