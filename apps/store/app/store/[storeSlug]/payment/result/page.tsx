import { Suspense } from "react"
import type { Metadata } from "next"

import { PaymentResultView } from "../../../../../components/checkout/payment-result-view"
import { OrdersMessage } from "../../../../../components/orders/orders-states"

export const metadata: Metadata = {
	title: "نتيجة الدفع",
}

/**
 * Gateway return landing (Paymera callbackURL) — a static segment, so it
 * shadows the storefront catch-all (`[[...slug]]`) and never goes through the
 * Puck renderer. `useSearchParams` in the view requires the Suspense boundary.
 */
export default function PaymentResultPage() {
	return (
		<main className="OrdersPage">
			<h1 className="OrdersPage-title">نتيجة الدفع</h1>
			<Suspense fallback={<OrdersMessage title="جارٍ التحميل…" />}>
				<PaymentResultView />
			</Suspense>
		</main>
	)
}
