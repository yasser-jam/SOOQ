import type { Metadata } from "next"

import { OrderDetailView } from "@/modules/storefront/components/orders/order-detail-view"

export const metadata: Metadata = {
	title: "تفاصيل الطلب",
}

type OrderDetailPageProps = {
	params: Promise<{ orderId: string }>
}

export default async function PublishedStoreOrderDetailPage({
	params,
}: OrderDetailPageProps) {
	const { orderId } = await params

	return (
		<main className="OrdersPage">
			<OrderDetailView orderId={orderId} />
		</main>
	)
}
