import type {
  AuthTokenResponse,
  GoogleOAuthInput,
  RequestOtpInput,
  VerifyOtpInput,
} from "./types"
import { createMockAuthTokens } from "@/lib/mock/jwt"

export const requestOtpDefaultValues: RequestOtpInput = {
  phone: "+963999000111",
  fullName: "تاجر SOOQ التجريبي",
}

export const verifyOtpDefaultValues: VerifyOtpInput = {
  phone: "+963999000111",
  otpCode: "123456",
  totpCode: "123456",
  backupCode: "",
}

export const googleOAuthDefaultValues: GoogleOAuthInput = {
  idToken: "",
  email: "",
  fullName: "",
  role: "OWNER",
  tenantSlug: "",
}

/** @deprecated Use `isMockApiEnabled()` from `@/lib/mock`. Kept as a sync alias for older call sites. */
export const devAuthEnabled = process.env.NEXT_PUBLIC_USE_MOCK_API === "true"

const normalizePhone = (phone: string): string => phone.replace(/\s+/g, "")

export const isDevRequestOtp = (input: Pick<RequestOtpInput, "phone">): boolean =>
  devAuthEnabled &&
  normalizePhone(input.phone) === normalizePhone(requestOtpDefaultValues.phone)

export const isDevVerifyOtp = (
  input: Pick<VerifyOtpInput, "phone" | "otpCode" | "totpCode">
): boolean =>
  devAuthEnabled &&
  normalizePhone(input.phone) === normalizePhone(verifyOtpDefaultValues.phone) &&
  input.otpCode.trim() === verifyOtpDefaultValues.otpCode &&
  (!input.totpCode ||
    input.totpCode.trim() === verifyOtpDefaultValues.totpCode)

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

/** @deprecated Prefer `createMockAuthTokens` from `@/lib/mock/jwt`. */
export const createDevAuthResponse = (): AuthTokenResponse =>
  createMockAuthTokens({
    phone: normalizePhone(verifyOtpDefaultValues.phone),
  })
