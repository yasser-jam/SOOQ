import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import cookiesConfig, { serverCookieOptions } from "@/config/cookies-config"

type Body = {
  accessToken?: string
  refreshToken?: string
  tenantSlug?: string | null
}

export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  const { accessToken, refreshToken, tenantSlug } = body
  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "missing_tokens" }, { status: 400 })
  }

  const store = await cookies()
  store.set(
    cookiesConfig.adminAccessToken,
    accessToken,
    serverCookieOptions(cookiesConfig.adminAccessToken)
  )
  store.set(
    cookiesConfig.refreshToken,
    refreshToken,
    serverCookieOptions(cookiesConfig.refreshToken)
  )

  if (tenantSlug) {
    store.set(
      cookiesConfig.tenantSlug,
      tenantSlug,
      serverCookieOptions(cookiesConfig.tenantSlug)
    )
  } else {
    store.delete(cookiesConfig.tenantSlug)
  }

  return NextResponse.json({ ok: true })
}
