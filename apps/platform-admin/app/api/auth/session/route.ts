import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import cookiesConfig, { serverCookieOptions } from "@/config/cookies-config"

type Body = {
  accessToken?: string
  refreshToken?: string
}

export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  const { accessToken, refreshToken } = body
  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "missing_tokens" }, { status: 400 })
  }

  const store = await cookies()
  store.set(
    cookiesConfig.accessToken,
    accessToken,
    serverCookieOptions(cookiesConfig.accessToken)
  )
  store.set(
    cookiesConfig.refreshToken,
    refreshToken,
    serverCookieOptions(cookiesConfig.refreshToken)
  )

  return NextResponse.json({ ok: true })
}
