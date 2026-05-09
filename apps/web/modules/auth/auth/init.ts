import type {
  GoogleOAuthInput,
  RequestOtpInput,
  VerifyOtpInput,
} from "./types"

export const requestOtpDefaultValues: RequestOtpInput = {
  phone: "",
  role: "OWNER",
  fullName: "",
  tenantSlug: "",
  tenantId: "",
}

export const verifyOtpDefaultValues: VerifyOtpInput = {
  phone: "",
  otpCode: "",
  totpCode: "",
  backupCode: "",
  tenantSlug: "",
  tenantId: "",
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
  role: input.role,
  fullName: input.fullName?.trim() || undefined,
  tenantSlug: input.tenantSlug?.trim() || undefined,
  tenantId: input.tenantId?.trim() || undefined,
})

export const cleanVerifyOtpPayload = (input: VerifyOtpInput): VerifyOtpInput => ({
  phone: input.phone.trim(),
  otpCode: input.otpCode.trim(),
  totpCode: input.totpCode?.trim() || undefined,
  backupCode: input.backupCode?.trim() || undefined,
  tenantSlug: input.tenantSlug?.trim() || undefined,
  tenantId: input.tenantId?.trim() || undefined,
})
