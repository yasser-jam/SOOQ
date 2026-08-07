import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import cookiesConfig, { serverCookieOptions } from "@/config/cookies-config"

type BackendRefreshEnvelope = {
  success?: boolean
  data?: {
    accessToken?: string
    refreshToken?: string
    expiresAt?: string
    [key: string]: unknown
  }
  errorCode?: string
  message?: string
}

const clearCookies = async () => {
  const store = await cookies()
  store.delete(cookiesConfig.accessToken)
  store.delete(cookiesConfig.refreshToken)
}

export async function POST() {
  const store = await cookies()
  const refreshToken = store.get(cookiesConfig.refreshToken)?.value

  if (!refreshToken) {
    await clearCookies()
    return NextResponse.json({ error: "missing_refresh" }, { status: 401 })
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
    cookiesConfig.accessToken,
    newAccess,
    serverCookieOptions(cookiesConfig.accessToken)
  )
  store.set(
    cookiesConfig.refreshToken,
    newRefresh,
    serverCookieOptions(cookiesConfig.refreshToken)
  )

  return NextResponse.json({ accessToken: newAccess, expiresAt })
}
