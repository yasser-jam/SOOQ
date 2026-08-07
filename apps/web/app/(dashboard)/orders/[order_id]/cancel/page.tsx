import type { OrderDetailsPageRouteProps } from "@/modules/order/order/model"
import OrderCancelPageView from "@/modules/order/order/components/order-cancel-page"

export default async function OrderCancelPage({
  params,
}: OrderDetailsPageRouteProps) {
  const { order_id } = await params

  return <OrderCancelPageView orderId={order_id} />
}
