import OrderDetailsPageView from "@/modules/order/order/components/order-details-page"
import type { OrderDetailsPageRouteProps } from "@/modules/order/order/model"

export default async function OrderDetailsPage({
	params,
}: OrderDetailsPageRouteProps) {
	const { order_id } = await params

	return <OrderDetailsPageView orderId={order_id} />
}
