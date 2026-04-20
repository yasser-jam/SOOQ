import type { OrderDetailsModel } from "@/modules/order/order/model"

import OrderAuditTimelineCard from "./order-audit-timeline-card"
import OrderCustomerCard from "./order-customer-card"
import OrderDetailsActions from "./order-details-actions"
import OrderInternalNotesCard from "./order-internal-notes-card"
import OrderSummaryCard from "./order-summary-card"

interface OrderDetailsPageViewProps {
  orderId: string
  model?: OrderDetailsModel
}

export default function OrderDetailsPageView({
  orderId,
  model,
}: OrderDetailsPageViewProps) {
  return (
    <div className="container my-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">تفاصيل الطلب</h1>

        <OrderDetailsActions orderId={orderId} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <OrderSummaryCard items={model?.items} pricing={model?.pricing} />
        </div>

        <div className="xl:col-span-4">
          <OrderCustomerCard customer={model?.customer} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <OrderAuditTimelineCard events={model?.auditTrail} />
        </div>

        <div className="xl:col-span-7">
          <OrderInternalNotesCard notes={model?.notes} />
        </div>
      </div>
    </div>
  )
}
