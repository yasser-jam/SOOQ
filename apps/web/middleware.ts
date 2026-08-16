import { NextRequest, NextResponse } from "next/server"

import cookiesConfig from "@/config/cookies-config"
import { TENANT_UUID_REGEX } from "@/modules/storefront/lib/store-config"

// Paths bypassed entirely (no auth check):
// - Marketing landing at /welcome (interim until a separate domain)
// - Merchant signup/login (/request-otp, /verify-otp, /onboarding)
// - Customer-facing storefront auth at /shop/[slug]/...
// - Published customer storefront at /store/[tenantId]/... (UUID segment)
// - Static assets in `/images`
// - Next.js internals and the auth API
const PUBLIC_PREFIXES = [
	"/welcome",
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

/** Old merchant bookmarks: /store/{slug}/products → /products */
function redirectLegacyMerchantStorePath(
	request: NextRequest,
): NextResponse | null {
	const { pathname } = request.nextUrl
	const match = pathname.match(/^\/store\/([^/]+)(\/.*)?$/)
	if (!match) return null

	const segment = decodeURIComponent(match[1]!)
	if (TENANT_UUID_REGEX.test(segment)) return null

	const rest = match[2] ?? ""
	const redirectUrl = request.nextUrl.clone()
	redirectUrl.pathname = rest || "/"
	return NextResponse.redirect(redirectUrl, 308)
}

export function middleware(request: NextRequest) {
	const storefrontRewrite = rewritePublishedStorefront(request)
	if (storefrontRewrite) return storefrontRewrite

	const legacyRedirect = redirectLegacyMerchantStorePath(request)
	if (legacyRedirect) return legacyRedirect

	const { pathname } = request.nextUrl

	if (isPublic(pathname)) {
		return NextResponse.next()
	}

	const accessToken = request.cookies.get(cookiesConfig.adminAccessToken)?.value
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
	// `seed-images` is a public/ folder the seeder fetches as binary. Without the
	// exclusion an unauthenticated fetch gets the login page's HTML back with a
	// 200, which then fails to decode as an image.
	matcher: ["/((?!_next/static|_next/image|favicon.ico|seed-images).*)"],
}
