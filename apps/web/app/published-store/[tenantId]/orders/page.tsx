import type { Metadata } from "next"

import { OrdersView } from "@/modules/storefront/components/orders/orders-view"

export const metadata: Metadata = {
	title: "طلباتي",
}

/**
 * Customer order history for the published storefront.
 *
 * A static segment, so it shadows the storefront catch-all (`[[...slug]]`) and
 * never goes through the Puck renderer. Public URL is
 * `/store/<tenantId>/orders` — `middleware.ts` rewrites that to this route
 * whenever the segment is a tenant UUID.
 */
export default function PublishedStoreOrdersPage() {
	return (
		<main className="OrdersPage">
			<h1 className="OrdersPage-title">طلباتي</h1>
			<OrdersView />
		</main>
	)
}
