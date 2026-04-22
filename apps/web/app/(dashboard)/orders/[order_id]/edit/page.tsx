import type { OrderDetailsPageRouteProps } from "@/modules/order/order/model"
import OrderEditPageView from "@/modules/order/order/components/order-edit-page"

export default async function OrderEditPage({
  params,
}: OrderDetailsPageRouteProps) {
  const { order_id } = await params

  return <OrderEditPageView orderId={order_id} />
}
