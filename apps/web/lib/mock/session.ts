import cookiesConfig from "@/config/cookies-config"
import { getCookie } from "@/lib/cookies"
import { isMockApiEnabled } from "@/lib/mock/enabled"
import { getMockDb, updateMockDb } from "@/lib/mock/db"
import { createMockAuthTokens } from "@/lib/mock/jwt"
import { MOCK_HUB_TENANT_ID } from "@/lib/mock/seed"
import { REGISTRATION_HUB_SLUG } from "@/modules/auth/auth/types"

import type { RefreshResult } from "@/lib/auth/internal"

/**
 * Client-side mock refresh: rebuilds JWTs from the in-browser mock DB so
 * post-onboarding slug changes land in cookies without calling Spring.
 * Posts directly to `/api/auth/session` to avoid a circular import with
 * `lib/auth/internal`.
 */
export const mockRefreshSession = async (): Promise<RefreshResult | null> => {
  if (!isMockApiEnabled() || typeof window === "undefined") return null

  const db = getMockDb()
  const settings = db.settings
  const tenantSlug = settings.isConfigured
    ? (settings.slug ?? REGISTRATION_HUB_SLUG)
    : REGISTRATION_HUB_SLUG
  const tenantId = settings.isConfigured
    ? settings.tenantId
    : MOCK_HUB_TENANT_ID

  const tokens = createMockAuthTokens({
    phone: db.user.phone,
    email: db.user.email,
    userId: db.user.userId,
    tenantId,
    tenantSlug,
    roles: db.user.roles,
  })

  updateMockDb((next) => {
    next.session = {
      userId: tokens.userId,
      tenantId: tokens.tenantId,
      tenantSlug: tokens.tenantSlug ?? REGISTRATION_HUB_SLUG,
      refreshToken: tokens.refreshToken,
    }
    return next
  })

  const response = await fetch("/api/auth/session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tenantSlug: tokens.tenantSlug ?? null,
    }),
    cache: "no-store",
  })

  if (!response.ok) return null

  return {
    accessToken: tokens.accessToken,
    expiresAt: tokens.expiresAt,
    tenantSlug: tokens.tenantSlug ?? null,
  }
}

/** True when the current refresh cookie is a mock token (or mock mode is on). */
export const shouldUseMockRefresh = (): boolean => {
  if (!isMockApiEnabled()) return false
  const refresh = getCookie(cookiesConfig.refreshToken)
  return !refresh || refresh.startsWith("mock-refresh:")
}
