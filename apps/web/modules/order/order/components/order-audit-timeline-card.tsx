import type { AdminOrderTimelineEvent } from "@/modules/order/order/types"
import { formatOrderDateTime } from "@/modules/order/order/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

interface OrderAuditTimelineCardProps {
  events?: AdminOrderTimelineEvent[]
  isLoading?: boolean
}

interface OrderAuditTimelineRowProps {
  event?: AdminOrderTimelineEvent
  isLast?: boolean
  isLoading: boolean
}

const MOCK_EVENTS: AdminOrderTimelineEvent[] = [
  {
    id: "audit-mock-1",
    timestampLabel: "10:45AM",
    title: "تم استلام الطلب",
    description: "تم تسجيل الطلب بنجاح وهو الآن قيد المراجعة.",
    isCurrent: false,
  },
  {
    id: "audit-mock-2",
    timestampLabel: "11:10AM",
    title: "تمت مراجعة الطلب",
    description: "فريق العمليات أكد البيانات وتمت الموافقة على المتابعة.",
    isCurrent: true,
  },
  {
    id: "audit-mock-3",
    timestampLabel: "11:35AM",
    title: "جاهز للتجهيز",
    description: "تم إرسال الطلب إلى المستودع لبدء مرحلة التجهيز والشحن.",
    isCurrent: false,
  },
]

function OrderAuditTimelineRow({
  event,
  isLast,
  isLoading,
}: OrderAuditTimelineRowProps) {
  const hasData = !isLoading && Boolean(event)

  return (
    <div className="relative flex gap-4 w-full">
      {!isLast ? (
        <span className="absolute start-[5px] top-6 h-[calc(100%-0.2rem)] w-px bg-border" />
      ) : null}

      <span
        className={`absolute start-0 top-2.5 size-3 rounded-full ${
          event?.isCurrent ? "bg-secondary" : "bg-border"
        }`}
      />

      <div className="flex min-w-0 w-full flex-col gap-2 pb-8 pr-8">
        {hasData ? (
          <>
            <div className="flex justify-between w-full">
              <div>
                <p className="text-text text-lg font-semibold">
                  {event?.title ?? event?.eventType ?? "تحديث الطلب"}
                </p>
                <p className="text-sm leading-6 text-gray-500">
                  {event?.description ?? event?.details ?? "لا يوجد وصف إضافي."}
                </p>
              </div>

              <div className="min-w-20 pt-1 text-xs text-gray-500">
                {hasData
                  ? event?.timestampLabel ??
                    formatOrderDateTime(event?.createdAt ?? event?.occurredAt)
                  : "10:45AM"}
              </div>
            </div>
          </>
        ) : (
          <>
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </>
        )}
      </div>
    </div>
  )
}

export default function OrderAuditTimelineCard({
  events,
  isLoading = false,
}: OrderAuditTimelineCardProps) {
  const resolvedEvents = isLoading
    ? Array.from({ length: 3 }, () => undefined)
    : events?.length
      ? events
      : MOCK_EVENTS

  return (
    <Card className="h-full gap-6 py-6">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl">التدقيق التشغيلي</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        {resolvedEvents.map((event, index) => (
          <OrderAuditTimelineRow
            key={event?.id ?? `placeholder-${index}`}
            event={event}
            isLast={index === resolvedEvents.length - 1}
            isLoading={isLoading}
          />
        ))}
      </CardContent>
    </Card>
  )
}
