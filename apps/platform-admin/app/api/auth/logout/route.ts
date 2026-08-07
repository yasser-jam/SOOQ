import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import cookiesConfig from "@/config/cookies-config"
import { decodeJwt } from "@/lib/auth/jwt"

export async function POST() {
  const store = await cookies()
  const accessToken = store.get(cookiesConfig.accessToken)?.value
  const backendBase = process.env.NEXT_PUBLIC_API_URL

  if (accessToken && backendBase) {
    const jti = decodeJwt(accessToken)?.jti
    if (jti) {
      try {
        await fetch(`${backendBase}/auth/sessions/${jti}/revoke`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        })
      } catch {
        // best-effort revoke
      }
    }
  }

  store.delete(cookiesConfig.accessToken)
  store.delete(cookiesConfig.refreshToken)
  store.delete(cookiesConfig.userName)

  return new NextResponse(null, { status: 204 })
}
