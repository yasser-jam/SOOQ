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
  username: string
  phone: string | null
  email: string | null
  tenantId: string
  jti?: string
  roles: Role[]
  expiresAtSec?: number
}

export type RequestOtpInput = z.infer<typeof requestOtpSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type GoogleOAuthInput = z.infer<typeof googleOAuthSchema>

export type RequestOtpCommand = RequestOtpInput
export type VerifyOtpCommand = VerifyOtpInput
