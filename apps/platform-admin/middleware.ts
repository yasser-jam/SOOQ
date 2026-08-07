import { NextRequest, NextResponse } from "next/server"

import cookiesConfig from "@/config/cookies-config"

const PUBLIC_PREFIXES = [
  "/login",
  "/verify-otp",
  "/images",
  "/_next",
  "/favicon.ico",
  "/api/auth",
]

const isPublic = (pathname: string): boolean => {
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

  if (accessToken || refreshToken) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("redirect", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
