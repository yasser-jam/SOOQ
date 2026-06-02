import { NextRequest, NextResponse } from "next/server"

import cookiesConfig from "@/config/cookies-config"

// Paths bypassed entirely (no auth check):
// - Merchant signup/login at the app root (/request-otp, /verify-otp, /onboarding)
// - Customer-facing storefront and its auth at /shop/[slug]/...
// - Next.js internals and the auth API
const PUBLIC_PREFIXES = [
  "/request-otp",
  "/verify-otp",
  "/onboarding",
  "/shop",
  "/_next",
  "/favicon.ico",
  "/api/auth",
]

const isPublic = (pathname: string): boolean =>
  PUBLIC_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- إضافة للتطوير فقط: تخطي تسجيل الدخول ---
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next()
  }
  // -------------------------------------------

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get(cookiesConfig.accessToken)?.value
  const refreshToken = request.cookies.get(cookiesConfig.refreshToken)?.value

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





/*export function middleware(request: NextRequest) {
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
*/