import type {
  RequestCustomerOtpInput,
  VerifyCustomerOtpInput,
} from "./types"

export const requestCustomerOtpDefaultValues: RequestCustomerOtpInput = {
  phone: "",
  tenantSlug: "",
  fullName: "",
}

export const verifyCustomerOtpDefaultValues: VerifyCustomerOtpInput = {
  phone: "",
  tenantSlug: "",
  otpCode: "",
  totpCode: "",
  backupCode: "",
}

export const cleanRequestCustomerOtpPayload = (
  input: RequestCustomerOtpInput
): RequestCustomerOtpInput => ({
  phone: input.phone.trim(),
  tenantSlug: input.tenantSlug.trim(),
  fullName: input.fullName?.trim() || undefined,
})

export const cleanVerifyCustomerOtpPayload = (
  input: VerifyCustomerOtpInput
): VerifyCustomerOtpInput => ({
  phone: input.phone.trim(),
  tenantSlug: input.tenantSlug.trim(),
  otpCode: input.otpCode.trim(),
  totpCode: input.totpCode?.trim() || undefined,
  backupCode: input.backupCode?.trim() || undefined,
})
