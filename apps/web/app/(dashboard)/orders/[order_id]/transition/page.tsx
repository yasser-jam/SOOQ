import type { OrderDetailsPageRouteProps } from "@/modules/order/order/model"
import OrderTransitionPageView from "@/modules/order/order/components/order-transition-page"

export default async function OrderTransitionPage({
  params,
}: OrderDetailsPageRouteProps) {
  const { order_id } = await params

  return <OrderTransitionPageView orderId={order_id} />
}
