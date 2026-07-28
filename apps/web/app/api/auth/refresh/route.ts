import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import cookiesConfig, { serverCookieOptions } from "@/config/cookies-config"
import { decodeJwt } from "@/lib/auth/jwt"
import { isMockApiEnabled } from "@/lib/mock/enabled"
import { createMockAuthTokens, parseMockRefreshToken } from "@/lib/mock/jwt"

type BackendRefreshEnvelope = {
  success?: boolean
  data?: {
    accessToken?: string
    refreshToken?: string
    expiresAt?: string
    tenantId?: string
    [key: string]: unknown
  }
  errorCode?: string
  message?: string
}

const clearCookies = async () => {
  const store = await cookies()
  store.delete(cookiesConfig.adminAccessToken)
  store.delete(cookiesConfig.refreshToken)
}

export async function POST() {
  const store = await cookies()
  const refreshToken = store.get(cookiesConfig.refreshToken)?.value

  if (!refreshToken) {
    await clearCookies()
    return NextResponse.json({ error: "missing_refresh" }, { status: 401 })
  }

  // Mock API: mint a new unsigned JWT from the refresh token claims.
  // Prefer the client-side mockRefreshSession when available; this path
  // covers interceptor-driven refreshes that hit the Next route directly.
  if (isMockApiEnabled() && refreshToken.startsWith("mock-refresh:")) {
    const parsed = parseMockRefreshToken(refreshToken)
    if (!parsed) {
      await clearCookies()
      return NextResponse.json({ error: "refresh_failed" }, { status: 401 })
    }

    const tenantSlugCookie = store.get(cookiesConfig.tenantSlug)?.value
    const accessPayload = decodeJwt(store.get(cookiesConfig.adminAccessToken)?.value)
    const phone =
      (typeof accessPayload?.phone === "string" && accessPayload.phone) ||
      (typeof accessPayload?.username === "string" && accessPayload.username) ||
      parsed.userId
    const tokens = createMockAuthTokens({
      phone,
      email:
        typeof accessPayload?.email === "string" ? accessPayload.email : null,
      userId: parsed.userId,
      tenantId: parsed.tenantId,
      tenantSlug: tenantSlugCookie || parsed.tenantSlug,
    })

    store.set(
      cookiesConfig.adminAccessToken,
      tokens.accessToken,
      serverCookieOptions(cookiesConfig.adminAccessToken)
    )
    store.set(
      cookiesConfig.refreshToken,
      tokens.refreshToken,
      serverCookieOptions(cookiesConfig.refreshToken)
    )
    if (tokens.tenantSlug) {
      store.set(
        cookiesConfig.tenantSlug,
        tokens.tenantSlug,
        serverCookieOptions(cookiesConfig.tenantSlug)
      )
    }

    return NextResponse.json({
      accessToken: tokens.accessToken,
      expiresAt: tokens.expiresAt,
      tenantSlug: tokens.tenantSlug ?? null,
    })
  }

  const backendBase = process.env.NEXT_PUBLIC_API_URL
  if (!backendBase) {
    return NextResponse.json({ error: "backend_url_not_configured" }, { status: 500 })
  }

  let backendResponse: Response
  try {
    backendResponse = await fetch(`${backendBase}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    })
  } catch {
    return NextResponse.json({ error: "backend_unreachable" }, { status: 502 })
  }

  let payload: BackendRefreshEnvelope | null = null
  try {
    payload = (await backendResponse.json()) as BackendRefreshEnvelope
  } catch {
    payload = null
  }

  if (!backendResponse.ok || !payload?.data?.accessToken || !payload.data.refreshToken) {
    await clearCookies()
    return NextResponse.json(
      { error: payload?.errorCode ?? "refresh_failed" },
      { status: 401 }
    )
  }

  const { accessToken: newAccess, refreshToken: newRefresh, expiresAt } = payload.data

  store.set(
    cookiesConfig.adminAccessToken,
    newAccess,
    serverCookieOptions(cookiesConfig.adminAccessToken)
  )
  store.set(
    cookiesConfig.refreshToken,
    newRefresh,
    serverCookieOptions(cookiesConfig.refreshToken)
  )

  return NextResponse.json({ accessToken: newAccess, expiresAt })
}
