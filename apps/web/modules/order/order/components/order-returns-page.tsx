"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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

  const isCod = order?.paymentMethod === "COD"

  useEffect(() => {
    if (isCod) {
      toast.error(
        "استرداد طلبات الدفع عند التسليم يتم عبر تسوية مزود الشحن، ليس من هنا"
      )
      router.push(`/orders/${orderId}`)
    }
  }, [isCod, orderId, router])

  const handleClose = (open: boolean) => {
    if (!open) router.push(`/orders/${orderId}`)
  }

  if (isCod) return null

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
