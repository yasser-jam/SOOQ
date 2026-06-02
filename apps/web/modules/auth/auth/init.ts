import type {
  AuthTokenResponse,
  GoogleOAuthInput,
  RequestOtpInput,
  Role,
  VerifyOtpInput,
} from "./types"
import { REGISTRATION_HUB_SLUG } from "./types"

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

export const devAuthEnabled = true

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

const base64UrlEncode = (value: unknown): string => {
  const json = JSON.stringify(value)
  const base64 =
    typeof btoa === "function"
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, "utf8").toString("base64")

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

const makeUnsignedJwt = (payload: Record<string, unknown>): string =>
  [
    base64UrlEncode({ alg: "none", typ: "JWT" }),
    base64UrlEncode(payload),
    "dev-signature",
  ].join(".")

export const createDevAuthResponse = (): AuthTokenResponse => {
  const nowSec = Math.floor(Date.now() / 1000)
  const expiresIn = 60 * 60 * 24 * 365
  const expiresAt = new Date((nowSec + expiresIn) * 1000).toISOString()
  const roles: Role[] = ["OWNER"]
  const phone = normalizePhone(verifyOtpDefaultValues.phone)
  const userId = "dev-owner-user"
  const tenantId = "dev-registration-tenant"

  return {
    accessToken: makeUnsignedJwt({
      sub: userId,
      userId,
      username: phone,
      phone,
      tenantId,
      tenantSlug: REGISTRATION_HUB_SLUG,
      roles,
      iat: nowSec,
      exp: nowSec + expiresIn,
      jti: "dev-auth-token",
    }),
    refreshToken: "dev-refresh-token",
    tokenType: "Bearer",
    expiresIn,
    issuedAt: new Date(nowSec * 1000).toISOString(),
    expiresAt,
    username: phone,
    userId,
    tenantId,
    tenantSlug: REGISTRATION_HUB_SLUG,
    roles,
  }
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
