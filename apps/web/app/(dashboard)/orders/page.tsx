import { Suspense } from "react"

import OrdersPageView from "@/modules/order/order/components/view"

export default function OrdersPage() {
	return (
		<Suspense fallback={<div className="container my-6">جاري التحميل…</div>}>
			<OrdersPageView />
		</Suspense>
	)
}
