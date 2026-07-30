import type { Metadata } from "next"

import { ReturnsView } from "@/modules/storefront/components/returns/returns-view"

export const metadata: Metadata = {
	title: "مرتجعاتي",
}

/**
 * Customer return requests for the published storefront.
 *
 * Static segment like `orders`, so it shadows the storefront catch-all
 * (`[[...slug]]`). Public URL is `/store/<tenantId>/returns`.
 */
export default function PublishedStoreReturnsPage() {
	return (
		<main className="OrdersPage">
			<h1 className="OrdersPage-title">مرتجعاتي</h1>
			<ReturnsView />
		</main>
	)
}
