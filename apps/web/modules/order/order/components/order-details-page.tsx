"use client"

import { useQuery } from "@tanstack/react-query"

import { ORDER_STATUS_META } from "@/lib/domain-enums"
import {
  getAdminOrder,
  getAdminOrderTimeline,
} from "@/modules/order/order/actions"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import { Badge } from "@workspace/ui/components/badge"

import OrderAuditTimelineCard from "./order-audit-timeline-card"
import OrderCustomerCard from "./order-customer-card"
import OrderDetailsActions from "./order-details-actions"
import OrderInternalNotesCard from "./order-internal-notes-card"
import OrderPaymentCard from "./order-payment-card"
import OrderShipmentTrackingCard from "./order-shipment-tracking-card"
import OrderSummaryCard from "./order-summary-card"

interface OrderDetailsPageViewProps {
  orderId: string
}

export default function OrderDetailsPageView({
  orderId,
}: OrderDetailsPageViewProps) {
  const { data: order, isPending: isOrderLoading } = useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => getAdminOrder(orderId),
  })

  const { data: timeline, isPending: isTimelineLoading } = useQuery({
    queryKey: orderQueryKeys.timeline(orderId),
    queryFn: () => getAdminOrderTimeline(orderId),
  })

  const statusMeta = order?.status ? ORDER_STATUS_META[order.status] : undefined

  return (
    <div className="container my-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="page-title">تفاصيل الطلب</h1>
          {order?.orderNumber ? (
            <span className="text-lg text-muted-foreground" dir="ltr">
              #{order.orderNumber}
            </span>
          ) : null}
          {statusMeta ? (
            <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
          ) : null}
        </div>

        <OrderDetailsActions
          orderId={orderId}
          status={order?.status}
          invoiceNumber={order?.invoiceNumber}
          invoicePdfUrl={order?.invoicePdfUrl}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <OrderSummaryCard
            items={order?.items}
            pricing={order?.pricing}
            currencyCode={order?.currencyCode}
            isLoading={isOrderLoading}
          />
        </div>

        <div className="flex flex-col gap-6 xl:col-span-4">
          <OrderCustomerCard order={order} isLoading={isOrderLoading} />
          <OrderPaymentCard order={order} isLoading={isOrderLoading} />
        </div>
      </div>

      <OrderShipmentTrackingCard orderId={orderId} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <OrderAuditTimelineCard
            events={timeline}
            isLoading={isTimelineLoading}
          />
        </div>

        <div className="xl:col-span-7">
          <OrderInternalNotesCard
            orderId={orderId}
            order={order}
            isLoading={isOrderLoading}
          />
        </div>
      </div>
    </div>
  )
}
