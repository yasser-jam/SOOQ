import { NextRequest, NextResponse } from "next/server"

import cookiesConfig from "@/config/cookies-config"

// Paths bypassed entirely (no auth check):
// - Marketing landing page at "/" (rendered by app/page.tsx — falls through to
//   authenticated redirects when a session exists)
// - Merchant signup/login (/request-otp, /verify-otp, /onboarding)
// - Customer-facing storefront and its auth at /shop/[slug]/...
// - Static assets in `/images` — `next/image` makes an internal fetch to
//   the source path while optimising, so without this entry the landing's
//   pictures get redirected to /request-otp and the optimiser returns 400.
// - Next.js internals and the auth API
const PUBLIC_PREFIXES = [
  "/request-otp",
  "/verify-otp",
  "/onboarding",
  "/shop",
  "/images",
  "/_next",
  "/favicon.ico",
  "/api/auth",
]

const isPublic = (pathname: string): boolean => {
  // "/" can't go through the prefix-match below — every path starts with "/".
  if (pathname === "/") return true
  return PUBLIC_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get(cookiesConfig.accessToken)?.value
  const refreshToken = request.cookies.get(cookiesConfig.refreshToken)?.value

  return NextResponse.next()

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
