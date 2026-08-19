import type { Metadata } from "next"

import { OrdersView } from "@/components/orders/orders-view"

export const metadata: Metadata = {
	title: "طلباتي",
}

/**
 * Customer order history — a static segment, so it shadows the storefront
 * catch-all (`[[...slug]]`) and never goes through the Puck renderer.
 */
export default function OrdersPage() {
	return (
		<main className="OrdersPage">
			<h1 className="OrdersPage-title">طلباتي</h1>
			<OrdersView />
		</main>
	)
}
