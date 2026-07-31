import { notFound } from "next/navigation"

import { StoreTenantProvider } from "@/modules/storefront/lib/store-tenant-context"
import { isValidTenantId } from "@/modules/storefront/lib/store-config"
import { StorefrontProviders } from "@/modules/storefront/components/storefront-providers"

import "@/core/styles.css"
import "@/modules/storefront/styles/storefront.css"
import "leaflet/dist/leaflet.css"

type PublishedStoreLayoutProps = {
	children: React.ReactNode
	params: Promise<{ tenantId: string }>
}

export default async function PublishedStoreLayout({
	children,
	params,
}: PublishedStoreLayoutProps) {
	const { tenantId } = await params

	if (!isValidTenantId(tenantId)) {
		notFound()
	}

	return (
		<StorefrontProviders>
			<StoreTenantProvider tenantId={tenantId}>{children}</StoreTenantProvider>
		</StorefrontProviders>
	)
}
