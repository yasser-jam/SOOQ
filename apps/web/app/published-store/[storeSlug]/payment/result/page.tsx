import { Suspense } from "react"
import type { Metadata } from "next"

import { PaymentResultView } from "@/modules/storefront/components/checkout/payment-result-view"
import { OrdersMessage } from "@/modules/storefront/components/orders/orders-states"

export const metadata: Metadata = {
	title: "نتيجة الدفع",
}

/**
 * Gateway return landing (Paymera callbackURL) for the published storefront.
 *
 * Static segment like `returns`, so it shadows the storefront catch-all
 * (`[[...slug]]`). Public URL is `/store/<storeSlug>/payment/result?orderId=…`.
 * `useSearchParams` in the view requires the Suspense boundary.
 */
export default function PublishedStorePaymentResultPage() {
	return (
		<main className="OrdersPage">
			<h1 className="OrdersPage-title">نتيجة الدفع</h1>
			<Suspense fallback={<OrdersMessage title="جارٍ التحميل…" />}>
				<PaymentResultView />
			</Suspense>
		</main>
	)
}
