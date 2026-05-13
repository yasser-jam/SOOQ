import type * as z from "zod"

import type {
  googleOAuthSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from "./schema"

export const ROLES = [
  "OWNER",
  "MANAGER",
  "STAFF",
  "CUSTOMER",
  "DRIVER",
  "PLATFORM_ADMIN",
] as const

export type Role = (typeof ROLES)[number]

export type AuthTokenResponse = {
  accessToken: string
  refreshToken: string
  tokenType: "Bearer"
  expiresIn: number
  issuedAt: string
  expiresAt: string
  username: string
  userId: string
  tenantId: string
  tenantSlug?: string | null
  roles: Role[]
}

export type CurrentUser = {
  userId: string
  /**
   * Primary login channel — phone for OTP users, email for Google OAuth.
   * Mirrors the backend `username` claim. Use this for display ("logged in
   * as …") and session lookup. For data entry fall back to `phone`/`email`
   * directly so callers aren't forced to guess the channel.
   */
  username: string
  phone: string | null
  email: string | null
  tenantId: string
  tenantSlug?: string | null
  jti?: string
  roles: Role[]
  expiresAtSec?: number
}

export type RequestOtpInput = z.infer<typeof requestOtpSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type GoogleOAuthInput = z.infer<typeof googleOAuthSchema>

/**
 * Merchant OTP commands carry both the request body and an optional
 * `tenantSlug` value that the actions layer lifts into the
 * `X-Tenant-Slug` request header. Omit for registration (new store);
 * set to the public store slug for a returning-login OTP cycle.
 */
export type RequestOtpCommand = RequestOtpInput & { tenantSlug?: string }
export type VerifyOtpCommand = VerifyOtpInput & { tenantSlug?: string }

export const REGISTRATION_HUB_SLUG = "registration-hub"
