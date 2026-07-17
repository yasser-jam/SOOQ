import type { AuthTokenResponse, Role } from "@/modules/auth/auth/types"
import { REGISTRATION_HUB_SLUG } from "@/modules/auth/auth/types"

import {
  MOCK_HUB_TENANT_ID,
  MOCK_STORE_TENANT_ID,
  MOCK_USER_ID,
} from "./seed"

const base64UrlEncode = (value: unknown): string => {
  const json = JSON.stringify(value)
  const base64 =
    typeof btoa === "function"
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, "utf8").toString("base64")

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

export const makeUnsignedJwt = (payload: Record<string, unknown>): string =>
  [
    base64UrlEncode({ alg: "none", typ: "JWT" }),
    base64UrlEncode(payload),
    "mock-signature",
  ].join(".")

export type MockTokenInput = {
  phone: string
  userId?: string
  tenantId?: string
  tenantSlug?: string | null
  roles?: Role[]
  email?: string | null
}

export const createMockAuthTokens = (
  input: MockTokenInput
): AuthTokenResponse => {
  const nowSec = Math.floor(Date.now() / 1000)
  const expiresIn = 60 * 60 * 24 * 30
  const expiresAt = new Date((nowSec + expiresIn) * 1000).toISOString()
  const roles: Role[] = input.roles ?? ["OWNER"]
  const userId = input.userId ?? MOCK_USER_ID
  const tenantSlug = input.tenantSlug ?? REGISTRATION_HUB_SLUG
  const tenantId =
    input.tenantId ??
    (tenantSlug === REGISTRATION_HUB_SLUG
      ? MOCK_HUB_TENANT_ID
      : MOCK_STORE_TENANT_ID)
  const phone = input.phone.replace(/\s+/g, "")
  const jti = `mock-jti-${nowSec}`

  return {
    accessToken: makeUnsignedJwt({
      sub: userId,
      userId,
      username: phone,
      phone,
      email: input.email ?? null,
      tenantId,
      tenantSlug,
      roles,
      iat: nowSec,
      exp: nowSec + expiresIn,
      jti,
    }),
    refreshToken: `mock-refresh:${userId}:${tenantId}:${tenantSlug}:${jti}`,
    tokenType: "Bearer",
    expiresIn,
    issuedAt: new Date(nowSec * 1000).toISOString(),
    expiresAt,
    username: phone,
    userId,
    tenantId,
    tenantSlug,
    roles,
  }
}

export const parseMockRefreshToken = (
  refreshToken: string
): { userId: string; tenantId: string; tenantSlug: string } | null => {
  if (!refreshToken.startsWith("mock-refresh:")) return null
  const parts = refreshToken.split(":")
  if (parts.length < 4) return null
  return {
    userId: parts[1] ?? MOCK_USER_ID,
    tenantId: parts[2] ?? MOCK_HUB_TENANT_ID,
    tenantSlug: parts[3] ?? REGISTRATION_HUB_SLUG,
  }
}
