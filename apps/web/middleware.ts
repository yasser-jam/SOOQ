import { NextRequest, NextResponse } from "next/server"

import cookiesConfig from "@/config/cookies-config"

// Paths bypassed entirely (no auth check). Merchant signup/login and infra.
const PUBLIC_PREFIXES = [
  "/request-otp",
  "/verify-otp",
  "/onboarding",
  "/_next",
  "/favicon.ico",
  "/api/auth",
]

// Customer-facing routes nested under a tenant slug stay public — the customer
// has not yet logged in when hitting these. Currently only the customer OTP
// pages live here; Phase C will lift them to `/shop/[slug]/...`.
const TENANT_PUBLIC_SUBPATHS = ["request-otp", "verify-otp"]
const TENANT_PUBLIC_PATTERN = new RegExp(
  `^/store/[^/]+/(?:${TENANT_PUBLIC_SUBPATHS.join("|")})(?:/|$)`
)

const isPublic = (pathname: string): boolean => {
  if (
    PUBLIC_PREFIXES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
  ) {
    return true
  }
  return TENANT_PUBLIC_PATTERN.test(pathname)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get(cookiesConfig.accessToken)?.value
  const refreshToken = request.cookies.get(cookiesConfig.refreshToken)?.value

  // If we have either token, let the page render. The axios interceptor will
  // silently refresh on the first 401. Only redirect when both are missing.
  if (accessToken || refreshToken) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/request-otp", request.url)
  loginUrl.searchParams.set("redirect", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
