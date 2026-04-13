/**
 * Auth Guard Proxy
 *
 * Acts as a middleware-level gatekeeper for all non-public routes.
 * On every incoming request it applies two sequential checks:
 *
 *  1. Access token — if absent, the user is redirected to /login.
 *  2. Organization — if the organization cookie is absent and the user is not
 *     already on /onboarding/organization, they are redirected there so they
 *     complete the organization setup before accessing the app.
 *
 * Every request that passes both checks continues with an extra `x-pathname`
 * header injected so downstream server components can read the current route
 * without accessing the URL directly.
 *
 * The `config.matcher` ensures this proxy only runs on page routes, skipping
 * API routes, Next.js internals, the login page, and static assets.
 */
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies as cookiesConfig } from "@/config/cookies"

// This function can be marked `async` if using `await` inside
export async function proxy(request: NextRequest) {
  // create new headers with the pathname header (x-pathname)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", request.nextUrl.pathname)

  const cookieStore = await cookies()

  // get access token from cookie
  const accessToken = cookieStore.get(cookiesConfig.accessToken)?.value

  // if access token is not found, redirect to login
  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", request.url), {
      headers: requestHeaders,
    })
  }

  // return the next response with the new headers
  return NextResponse.next({
    headers: requestHeaders,
  })
}

export const config = {
  matcher: [
    // Exclude API routes, static files, image optimizations, and .png files
    "/((?!api|_next/static|_next/image|login|signup|forgot-password|reset-password|verify-otp|request-otp|.*\\.png$).*)",
  ],
}
