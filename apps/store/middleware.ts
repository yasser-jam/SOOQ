import { NextResponse, type NextRequest } from "next/server"

import { MARKETING_SITE_URL } from "./lib/store-config"

const STORE_PREFIX = /^\/store\/[^/]+(\/.*)?$/

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl

	if (STORE_PREFIX.test(pathname)) {
		return NextResponse.next()
	}

	return NextResponse.redirect(new URL(MARKETING_SITE_URL))
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
