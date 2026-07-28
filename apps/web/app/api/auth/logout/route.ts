import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import cookiesConfig from "@/config/cookies-config"
import { decodeJwt } from "@/lib/auth/jwt"

export async function POST() {
  const store = await cookies()
  const accessToken = store.get(cookiesConfig.adminAccessToken)?.value
  const backendBase = process.env.NEXT_PUBLIC_API_URL

  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "true"
  if (accessToken && backendBase && !useMock) {
    const jti = decodeJwt(accessToken)?.jti
    if (jti) {
      // Best-effort: revoke server-side. Ignore failures — we still want to
      // clear local cookies regardless.
      try {
        await fetch(`${backendBase}/auth/sessions/${jti}/revoke`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        })
      } catch {
        // swallow — we proceed to cookie cleanup
      }
    }
  }

  store.delete(cookiesConfig.adminAccessToken)
  store.delete(cookiesConfig.refreshToken)
  store.delete(cookiesConfig.tenantSlug)

  return new NextResponse(null, { status: 204 })
}
