import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import cookiesConfig from "@/config/cookies-config"
import { StoreTenantProvider } from "@/modules/storefront/lib/store-tenant-context"
import { StorefrontProviders } from "@/modules/storefront/components/storefront-providers"

import "@/core/styles.css"
import "@/modules/storefront/styles/storefront.css"
import "leaflet/dist/leaflet.css"

type PublishedStoreLayoutProps = {
	children: React.ReactNode
	params: Promise<{ storeSlug: string }>
}

export default async function PublishedStoreLayout({
	children,
	params,
}: PublishedStoreLayoutProps) {
	const { storeSlug } = await params

	// Middleware resolves the slug → tenant UUID and writes the cookies before
	// this request reaches here. If it's missing, the store doesn't exist.
	const cookieStore = await cookies()
	const tenantId = cookieStore.get(cookiesConfig.tenantId)?.value

	if (!storeSlug || !tenantId) {
		notFound()
	}

	return (
		<StorefrontProviders>
			<StoreTenantProvider tenantId={tenantId} storeSlug={storeSlug}>
				{children}
			</StoreTenantProvider>
		</StorefrontProviders>
	)
}
