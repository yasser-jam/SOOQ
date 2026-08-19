import { NextResponse, type NextRequest } from "next/server"

import cookiesConfig, { serverCookieOptions } from "@/config/cookies-config"

import { MARKETING_SITE_URL } from "./lib/store-config"

const STORE_PREFIX = /^\/store\/([^/]+)(\/.*)?$/

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
 * cookies are populated before the storefront tree renders, so a first visit
 * with no tenant cookie never reaches `StoreProvider`.
 */
async function ensureTenantCookies(
	request: NextRequest,
	slug: string,
): Promise<NextResponse | null> {
	const cookieSlug = request.cookies.get(cookiesConfig.tenantSlug)?.value
	const cookieTenantId = request.cookies.get(cookiesConfig.tenantId)?.value

	if (cookieTenantId && cookieSlug === slug) return null

	const store = await resolveStoreBySlug(slug)
	if (!store) return null

	request.cookies.set(cookiesConfig.tenantId, store.tenantId)
	request.cookies.set(cookiesConfig.tenantSlug, store.slug)
	if (store.primaryCurrencyCode) {
		request.cookies.set(cookiesConfig.primaryCurrency, store.primaryCurrencyCode)
	}

	const response = NextResponse.next({ request })
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

export async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl
	const match = pathname.match(STORE_PREFIX)

	if (match) {
		const slug = decodeURIComponent(match[1]!)
		const cookieResponse = await ensureTenantCookies(req, slug)
		return cookieResponse ?? NextResponse.next()
	}

	return NextResponse.redirect(new URL(MARKETING_SITE_URL))
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
