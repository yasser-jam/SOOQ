"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { getShipment, getShipmentEvents, transitionShipment } from "../actions"
import { SHIPMENT_STATUS_META, SHIPMENT_STATUS_TRANSITIONS } from "../model"
import { shipmentQueryKeys } from "../queryKeys"
import type { ShipmentStatus } from "../types"
import ShipmentTimelineCard from "./timeline"

export default function ShipmentDetailsPageView({ shipmentId }: { shipmentId: string }) {
  const queryClient = useQueryClient()

  const { data: shipment, isLoading: isShipmentLoading } = useQuery({
    queryKey: shipmentQueryKeys.detail(shipmentId),
    queryFn: () => getShipment(shipmentId),
  })

  const { data: events, isLoading: isEventsLoading } = useQuery({
    queryKey: shipmentQueryKeys.events(shipmentId),
    queryFn: () => getShipmentEvents(shipmentId),
  })

  const status = shipment?.shipmentStatus

  const allowedTargets = useMemo(() => {
    if (!status) return []
    return SHIPMENT_STATUS_TRANSITIONS[status]
  }, [status])

  const [targetStatus, setTargetStatus] = useState<ShipmentStatus | "">("")

  const { mutate: transition, isPending: isTransitioning } = useMutation({
    mutationFn: transitionShipment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: shipmentQueryKeys.detail(shipmentId) })
      await queryClient.invalidateQueries({ queryKey: shipmentQueryKeys.events(shipmentId) })
      setTargetStatus("")
    },
  })

  return (
    <div className="container">
      <div className="my-6 flex items-center justify-between">
        <div className="page-title">تفاصيل الشحنة</div>

        {status ? (
          <Badge variant={SHIPMENT_STATUS_META[status].badgeVariant}>
            {SHIPMENT_STATUS_META[status].label}
          </Badge>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl">بيانات الشحنة</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Order ID</span>
              <span dir="ltr">{shipment?.orderId ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">المزود</span>
              <span>{shipment?.providerName ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">COD المتوقع</span>
              <span dir="ltr">{shipment?.expectedCodAmountSyp ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">COD المحصل</span>
              <span dir="ltr">{shipment?.collectedCodAmountSyp ?? 0}</span>
            </div>

            {shipment?.carrierTrackingUrl ? (
              <Button asChild variant="secondary" className="mt-2">
                <a href={shipment.carrierTrackingUrl} target="_blank" rel="noreferrer">
                  تتبع عبر شركة الشحن
                </a>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 grid gap-6">
          {status && allowedTargets.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">تحديث الحالة</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Select value={targetStatus} onValueChange={(v) => setTargetStatus(v as ShipmentStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة الجديدة" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedTargets.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SHIPMENT_STATUS_META[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  disabled={!targetStatus || isTransitioning}
                  onClick={() => {
                    if (!targetStatus) return
                    transition({ id: shipmentId, data: { targetStatus } })
                  }}
                >
                  تحديث
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <ShipmentTimelineCard events={events} isLoading={isShipmentLoading || isEventsLoading} />
        </div>
      </div>
    </div>
  )
}
