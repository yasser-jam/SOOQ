import type { Metadata } from "next"
import Link from "next/link"

import { OrdersView } from "@/modules/storefront/components/orders/orders-view"
import { buildStoreBasePath } from "@/modules/storefront/lib/store-config"

export const metadata: Metadata = {
	title: "طلباتي",
}

type OrdersPageProps = {
	params: Promise<{ tenantId: string }>
}

/**
 * Customer order history for the published storefront.
 *
 * A static segment, so it shadows the storefront catch-all (`[[...slug]]`) and
 * never goes through the Puck renderer. Public URL is
 * `/store/<tenantId>/orders` — `middleware.ts` rewrites that to this route
 * whenever the segment is a tenant UUID.
 */
export default async function PublishedStoreOrdersPage({
	params,
}: OrdersPageProps) {
	const { tenantId } = await params

	return (
		<main className="OrdersPage">
			<div className="OrdersPage-head">
				<h1 className="OrdersPage-title">طلباتي</h1>
				<Link
					className="OrdersButton"
					href={`${buildStoreBasePath(tenantId)}/returns`}
				>
					مرتجعاتي
				</Link>
			</div>
			<OrdersView />
		</main>
	)
}
