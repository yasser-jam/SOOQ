import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import cookiesConfig from "@/config/cookies-config"

import { StoreTenantProvider } from "../../../lib/store-tenant-context"

type StoreLayoutProps = {
	children: React.ReactNode
	params: Promise<{ storeSlug: string }>
}

export default async function StoreLayout({
	children,
	params,
}: StoreLayoutProps) {
	const { storeSlug } = await params

	// Middleware resolves the slug → tenant UUID and writes the cookies before
	// this request reaches here. If it's missing, the store doesn't exist.
	const cookieStore = await cookies()
	const tenantId = cookieStore.get(cookiesConfig.tenantId)?.value

	if (!storeSlug || !tenantId) {
		notFound()
	}

	return (
		<StoreTenantProvider tenantId={tenantId} storeSlug={storeSlug}>
			{children}
		</StoreTenantProvider>
	)
}
