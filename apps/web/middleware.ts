import { NextRequest, NextResponse } from "next/server"

import cookiesConfig from "@/config/cookies-config"

const PUBLIC_ROUTES = [
  "/request-otp",
  "/verify-otp",
  "/_next",
  "/favicon.ico",
  "/api/auth",
  "/store",
]

const isPublic = (pathname: string): boolean =>
  PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))

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
