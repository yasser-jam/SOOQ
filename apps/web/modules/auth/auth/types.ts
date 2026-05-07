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

export type Permission = string

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
  permissions: Permission[]
}

export type CurrentUser = {
  userId: string
  username: string
  tenantId: string
  tenantSlug?: string | null
  jti?: string
  roles: Role[]
  permissions: Permission[]
  expiresAtSec?: number
}

export type RequestOtpInput = z.infer<typeof requestOtpSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type GoogleOAuthInput = z.infer<typeof googleOAuthSchema>

export const REGISTRATION_HUB_SLUG = "registration-hub"
