import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { ShipmentStatusEvent } from "../types"
import { SHIPMENT_STATUS_META } from "../model"
import { formatShipmentDateTime } from "../utils"

function TimelineRow({
  event,
  isLast,
  isLoading,
}: {
  event?: ShipmentStatusEvent
  isLast?: boolean
  isLoading: boolean
}) {
  const hasData = !isLoading && Boolean(event)
  const status = event?.toStatus
  const title = status ? SHIPMENT_STATUS_META[status].label : "تحديث"

  return (
    <div className="relative flex w-full gap-4">
      {!isLast ? (
        <span className="absolute start-[5px] top-6 h-[calc(100%-0.2rem)] w-px bg-border" />
      ) : null}
      <span className="absolute start-0 top-2.5 size-3 rounded-full bg-border" />

      <div className="flex min-w-0 w-full flex-col gap-2 pb-8 pr-8">
        {hasData ? (
          <div className="flex justify-between w-full">
            <div>
              <p className="text-text text-lg font-semibold">{title}</p>
              {event?.fromStatus ? (
                <p className="text-sm leading-6 text-gray-500">
                  {SHIPMENT_STATUS_META[event.fromStatus].label} → {title}
                </p>
              ) : (
                <p className="text-sm leading-6 text-gray-500">تم إنشاء الشحنة</p>
              )}
            </div>

            <div className="min-w-20 pt-1 text-xs text-gray-500" dir="ltr">
              {formatShipmentDateTime(event?.createdAt)}
            </div>
          </div>
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

export default function ShipmentTimelineCard({
  events,
  isLoading = false,
}: {
  events?: ShipmentStatusEvent[]
  isLoading?: boolean
}) {
  const resolvedEvents = isLoading
    ? Array.from({ length: 3 }, () => undefined)
    : events?.length
      ? events
      : []

  return (
    <Card className="h-full gap-6 py-6">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl">حالة الشحنة</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        {resolvedEvents.length ? (
          resolvedEvents.map((event, index) => (
            <TimelineRow
              key={event?.shipmentStatusEventId ?? `placeholder-${index}`}
              event={event}
              isLast={index === resolvedEvents.length - 1}
              isLoading={isLoading}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">لا يوجد سجل حالة بعد.</p>
        )}
      </CardContent>
    </Card>
  )
}
