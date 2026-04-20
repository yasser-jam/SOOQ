import OrderReturnsPageView from "@/modules/order/order/components/order-returns-page"
import type { OrderReturnsPageRouteProps } from "@/modules/order/order/model"

export default async function OrderReturnsPage({
  params,
}: OrderReturnsPageRouteProps) {
  const { order_id } = await params

  return <OrderReturnsPageView orderId={order_id} />
}
