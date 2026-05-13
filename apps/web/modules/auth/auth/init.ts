import type {
  GoogleOAuthInput,
  RequestOtpInput,
  VerifyOtpInput,
} from "./types"

export const requestOtpDefaultValues: RequestOtpInput = {
  phone: "",
  fullName: "",
}

export const verifyOtpDefaultValues: VerifyOtpInput = {
  phone: "",
  otpCode: "",
  totpCode: "",
  backupCode: "",
}

export const googleOAuthDefaultValues: GoogleOAuthInput = {
  idToken: "",
  email: "",
  fullName: "",
  role: "OWNER",
  tenantSlug: "",
}

export const cleanRequestOtpPayload = (input: RequestOtpInput): RequestOtpInput => ({
  phone: input.phone.trim(),
  fullName: input.fullName?.trim() || undefined,
})

export const cleanVerifyOtpPayload = (input: VerifyOtpInput): VerifyOtpInput => ({
  phone: input.phone.trim(),
  otpCode: input.otpCode.trim(),
  totpCode: input.totpCode?.trim() || undefined,
  backupCode: input.backupCode?.trim() || undefined,
})
