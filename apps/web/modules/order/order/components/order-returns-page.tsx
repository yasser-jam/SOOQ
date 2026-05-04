"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { getAdminOrder } from "@/modules/order/order/actions"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import InitiateRefundDialog from "@/modules/payment/refund/components/initiate-refund-dialog"

interface OrderReturnsPageViewProps {
  orderId: string
}

export default function OrderReturnsPageView({
  orderId,
}: OrderReturnsPageViewProps) {
  const router = useRouter()

  const { data: order } = useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => getAdminOrder(orderId),
  })

  const handleClose = (open: boolean) => {
    if (!open) router.push(`/orders/${orderId}`)
  }

  return (
    <InitiateRefundDialog
      open
      onOpenChange={handleClose}
      orderId={orderId}
      orderNumber={order?.orderNumber}
      orderTotal={order?.pricing?.total}
      paymentMethod={order?.paymentMethod}
    />
  )
}
