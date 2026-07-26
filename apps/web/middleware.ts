import { NextRequest, NextResponse } from "next/server"

import cookiesConfig from "@/config/cookies-config"
import { TENANT_UUID_REGEX } from "@/modules/storefront/lib/store-config"

// Paths bypassed entirely (no auth check):
// - Marketing landing page at "/" (rendered by app/page.tsx — falls through to
//   authenticated redirects when a session exists)
// - Merchant signup/login (/request-otp, /verify-otp, /onboarding)
// - Customer-facing storefront and its auth at /shop/[slug]/...
// - Published customer storefront at /store/[tenantId]/... (UUID segment)
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
	if (pathname === "/") return true

	if (isPublishedStorefrontPath(pathname)) return true

	return PUBLIC_PREFIXES.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`),
	)
}

function isPublishedStorefrontPath(pathname: string): boolean {
	const match = pathname.match(/^\/store\/([^/]+)(\/.*)?$/)
	if (!match) return false
	return TENANT_UUID_REGEX.test(decodeURIComponent(match[1]!))
}

function rewritePublishedStorefront(
	request: NextRequest,
): NextResponse | null {
	const { pathname } = request.nextUrl
	const match = pathname.match(/^\/store\/([^/]+)(\/.*)?$/)
	if (!match) return null

	const tenantId = decodeURIComponent(match[1]!)
	if (!TENANT_UUID_REGEX.test(tenantId)) return null

	const rest = match[2] ?? ""
	const rewriteUrl = request.nextUrl.clone()
	rewriteUrl.pathname = `/published-store/${tenantId}${rest}`

	return NextResponse.rewrite(rewriteUrl)
}

export function middleware(request: NextRequest) {
	const storefrontRewrite = rewritePublishedStorefront(request)
	if (storefrontRewrite) return storefrontRewrite

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
