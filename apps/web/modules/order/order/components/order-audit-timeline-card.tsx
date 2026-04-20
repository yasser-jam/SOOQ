import type { OrderAuditEventModel } from "@/modules/order/order/model"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

interface OrderAuditTimelineCardProps {
  events?: OrderAuditEventModel[]
}

interface OrderAuditTimelineRowProps {
  event?: OrderAuditEventModel
  isLast?: boolean
}

function OrderAuditTimelineRow({ event, isLast }: OrderAuditTimelineRowProps) {
  const hasData = Boolean(event)

  return (
    <div className="relative flex gap-4 pe-8">
      <span
        className={`absolute end-0 top-2.5 size-3 rounded-full ${
          event?.isCurrent ? "bg-secondary" : "bg-border"
        }`}
      />
      {!isLast ? (
        <span className="absolute end-[5px] top-6 h-[calc(100%-0.2rem)] w-px bg-border" />
      ) : null}

      <div className="min-w-20 pt-1 text-xs text-muted-foreground">
        {hasData ? event?.timestampLabel : "--:--"}
      </div>

      <div className="flex min-w-0 flex-col gap-2 pb-8">
        {hasData ? (
          <>
            <p className="text-text text-xl font-semibold">{event?.title}</p>
            <p className="text-text-secondary text-sm leading-7">
              {event?.description}
            </p>
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
}: OrderAuditTimelineCardProps) {
  return (
    <Card className="h-full gap-6 py-6">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl">التدقيق التشغيلي</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        {events?.length ? (
          events.map((event, index) => (
            <OrderAuditTimelineRow
              key={event.id}
              event={event}
              isLast={index === events.length - 1}
            />
          ))
        ) : (
          <>
            <OrderAuditTimelineRow />
            <OrderAuditTimelineRow />
            <OrderAuditTimelineRow isLast />
          </>
        )}
      </CardContent>
    </Card>
  )
}
