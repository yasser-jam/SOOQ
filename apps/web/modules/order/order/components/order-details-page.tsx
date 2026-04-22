"use client"

import { useQuery } from "@tanstack/react-query"

import {
  getAdminOrder,
  getAdminOrderTimeline,
} from "@/modules/order/order/actions"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"

import OrderAuditTimelineCard from "./order-audit-timeline-card"
import OrderCustomerCard from "./order-customer-card"
import OrderDetailsActions from "./order-details-actions"
import OrderInternalNotesCard from "./order-internal-notes-card"
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

  return (
    <div className="container my-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">تفاصيل الطلب</h1>

        <OrderDetailsActions orderId={orderId} status={order?.status} />
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

        <div className="xl:col-span-4">
          <OrderCustomerCard order={order} isLoading={isOrderLoading} />
        </div>
      </div>

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
