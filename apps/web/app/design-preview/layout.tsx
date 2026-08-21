import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import cookiesConfig from "@/config/cookies-config"
import { getTenantIdFromToken } from "@/lib/jwt"
import { StoreTenantProvider } from "@/modules/storefront/lib/store-tenant-context"
import { StorefrontProviders } from "@/modules/storefront/components/storefront-providers"

import "@/core/styles.css"
import "@/modules/storefront/styles/storefront.css"
import "leaflet/dist/leaflet.css"

const DESIGN_PREVIEW_BASE_PATH = "/design-preview"

export default async function DesignPreviewLayout({
	children,
}: {
	children: React.ReactNode
}) {
	// `middleware.ts` already redirects unauthenticated requests to
	// /request-otp before this renders, so a missing/undecodable token here
	// means the session cookie is stale — treat it the same as "not found"
	// rather than rendering a draft with no tenant scope.
	const cookieStore = await cookies()
	const accessToken = cookieStore.get(cookiesConfig.adminAccessToken)?.value
	const tenantId = accessToken ? getTenantIdFromToken(accessToken) : null

	if (!tenantId) {
		notFound()
	}

	return (
		<StorefrontProviders>
			<StoreTenantProvider
				tenantId={tenantId}
				basePath={DESIGN_PREVIEW_BASE_PATH}
			>
				{children}
			</StoreTenantProvider>
		</StorefrontProviders>
	)
}
