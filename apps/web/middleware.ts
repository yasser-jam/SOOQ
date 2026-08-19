import { NextRequest, NextResponse } from "next/server"

import cookiesConfig, { serverCookieOptions } from "@/config/cookies-config"

// Paths bypassed entirely (no auth check):
// - Marketing landing at /welcome (interim until a separate domain)
// - Merchant signup/login (/request-otp, /verify-otp, /onboarding)
// - Customer-facing storefront auth at /shop/[slug]/...
// - Published customer storefront at /store/[storeSlug]/...
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
	return /^\/store\/[^/]+(\/.*)?$/.test(pathname)
}

// Keep in sync with `MOCK_STORE_TENANT_ID` / `MOCK_STORE_SLUG` in
// apps/web/lib/mock/seed.ts. Middleware runs on the Edge runtime, so it
// avoids importing the (heavy) mock seed module — this is only a fallback
// for when the by-slug lookup fails while mock mode is on.
const MOCK_STORE_TENANT_ID = "00000000-0000-4000-8000-000000000002"
const MOCK_STORE_SLUG = "demo-store"
const MOCK_STORE_CURRENCY = "SYP"

type ResolvedStore = {
	tenantId: string
	slug: string
	primaryCurrencyCode: string | null
}

async function resolveStoreBySlug(slug: string): Promise<ResolvedStore | null> {
	const apiUrl = process.env.NEXT_PUBLIC_API_URL
	if (apiUrl) {
		try {
			const res = await fetch(
				`${apiUrl.replace(/\/$/, "")}/public/stores/by-slug/${encodeURIComponent(slug)}`,
				{ headers: { Accept: "application/json" } },
			)
			if (res.ok) {
				const json = await res.json()
				const data = json?.data
				if (data?.tenantId && data?.slug) {
					return {
						tenantId: data.tenantId,
						slug: data.slug,
						primaryCurrencyCode: data.primaryCurrencyCode ?? null,
					}
				}
			}
		} catch {
			// fall through to mock fallback below
		}
	}

	if (process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
		return {
			tenantId: MOCK_STORE_TENANT_ID,
			slug: MOCK_STORE_SLUG,
			primaryCurrencyCode: MOCK_STORE_CURRENCY,
		}
	}

	return null
}

/**
 * Ensures the `sooq-tenant-id` / `sooq-tenant-slug` / `sooq-primary-currency`
 * cookies are populated *before* the published-store tree renders, so
 * `StoreProvider` never sees a first visit with no tenant cookie. Resolves
 * the URL's store slug via the public by-slug lookup and writes the result
 * onto both the incoming request (so this same request's Server Components
 * see it via `cookies()`) and the outgoing response (so the browser gets it).
 */
async function rewritePublishedStorefront(
	request: NextRequest,
): Promise<NextResponse | null> {
	const { pathname } = request.nextUrl
	const match = pathname.match(/^\/store\/([^/]+)(\/.*)?$/)
	if (!match) return null

	const slug = decodeURIComponent(match[1]!)
	const rest = match[2] ?? ""
	const rewriteUrl = request.nextUrl.clone()
	rewriteUrl.pathname = `/published-store/${slug}${rest}`

	const cookieSlug = request.cookies.get(cookiesConfig.tenantSlug)?.value
	const cookieTenantId = request.cookies.get(cookiesConfig.tenantId)?.value

	if (!cookieTenantId || cookieSlug !== slug) {
		const store = await resolveStoreBySlug(slug)
		if (store) {
			request.cookies.set(cookiesConfig.tenantId, store.tenantId)
			request.cookies.set(cookiesConfig.tenantSlug, store.slug)
			if (store.primaryCurrencyCode) {
				request.cookies.set(
					cookiesConfig.primaryCurrency,
					store.primaryCurrencyCode,
				)
			}

			const response = NextResponse.rewrite(rewriteUrl, { request })
			response.cookies.set(
				cookiesConfig.tenantId,
				store.tenantId,
				serverCookieOptions(cookiesConfig.tenantId),
			)
			response.cookies.set(
				cookiesConfig.tenantSlug,
				store.slug,
				serverCookieOptions(cookiesConfig.tenantSlug),
			)
			if (store.primaryCurrencyCode) {
				response.cookies.set(
					cookiesConfig.primaryCurrency,
					store.primaryCurrencyCode,
					serverCookieOptions(cookiesConfig.primaryCurrency),
				)
			}
			return response
		}
	}

	return NextResponse.rewrite(rewriteUrl, { request })
}

export async function middleware(request: NextRequest) {
	const storefrontRewrite = await rewritePublishedStorefront(request)
	if (storefrontRewrite) return storefrontRewrite

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
