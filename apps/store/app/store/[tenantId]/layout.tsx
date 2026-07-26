import { notFound } from "next/navigation"

import { StoreTenantProvider } from "../../../lib/store-tenant-context"
import { isValidTenantId } from "../../../lib/store-config"

type StoreLayoutProps = {
	children: React.ReactNode
	params: Promise<{ tenantId: string }>
}

export default async function StoreLayout({
	children,
	params,
}: StoreLayoutProps) {
	const { tenantId } = await params

	if (!isValidTenantId(tenantId)) {
		notFound()
	}

	return <StoreTenantProvider tenantId={tenantId}>{children}</StoreTenantProvider>
}
