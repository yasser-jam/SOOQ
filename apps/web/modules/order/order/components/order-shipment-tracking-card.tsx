"use client"

import { useQuery } from "@tanstack/react-query"
import { ExternalLink, MapPin, PackageOpen, Truck } from "lucide-react"

import { api } from "@/lib/api"
import { SHIPMENT_STATUS_META, type ShipmentStatus } from "@/lib/domain-enums"
import type { ApiResponse } from "@/lib/types"
import { formatOrderDateTime } from "@/modules/order/order/utils"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

interface ShipmentStatusHistoryEntry {
  status: ShipmentStatus
  timestamp: string
}

interface PublicShipmentTrackingResponse {
  shipmentId?: string
  orderId?: string
  shipmentStatus?: ShipmentStatus
  statusLabel?: string
  carrierTrackingUrl?: string | null
  officePickupInstructions?: string | null
  deliveredAt?: string | null
  createdAt?: string
  statusHistory?: ShipmentStatusHistoryEntry[]
}

interface OrderShipmentTrackingCardProps {
  orderId: string
}

const fetchShipmentTracking = async (
  orderId: string
): Promise<PublicShipmentTrackingResponse | null> => {
  try {
    const response = await api<ApiResponse<PublicShipmentTrackingResponse>>(
      `/public/shipping/track/${orderId}`
    )
    return response.data ?? null
  } catch (error) {
    const status = (error as { status?: number })?.status

    if (status === 404) return null

    throw error
  }
}

export default function OrderShipmentTrackingCard({
  orderId,
}: OrderShipmentTrackingCardProps) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["public", "shipping", "track", orderId],
    queryFn: () => fetchShipmentTracking(orderId),
    retry: false,
  })

  return (
    <Card className="gap-6 rounded-3xl py-6">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-xl">تتبع الشحنة</CardTitle>

          {data?.carrierTrackingUrl ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              asChild
            >
              <a
                href={data.carrierTrackingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                التتبع عبر شركة الشحن
                <ExternalLink data-icon="inline-end" />
              </a>
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : !data || isError ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <PackageOpen className="size-10 text-muted-foreground" />
            <p className="text-base font-medium text-foreground">
              بانتظار الشحن
            </p>
            <p className="text-sm text-muted-foreground">
              لم يتم إنشاء شحنة لهذا الطلب بعد. ستظهر تفاصيل التتبع هنا فور
              تجهيز الشحنة.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                الحالة الحالية
              </span>
              {data.shipmentStatus ? (
                <Badge
                  variant={SHIPMENT_STATUS_META[data.shipmentStatus]?.badgeVariant}
                >
                  {data.statusLabel ??
                    SHIPMENT_STATUS_META[data.shipmentStatus]?.label}
                </Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>

            {data.officePickupInstructions ? (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <MapPin className="mt-0.5 size-5 shrink-0 text-amber-700" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-amber-900">
                    جاهز للاستلام من المكتب
                  </p>
                  <p className="text-sm leading-6 text-amber-800">
                    {data.officePickupInstructions}
                  </p>
                </div>
              </div>
            ) : null}

            {data.deliveredAt ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                تم التسليم في {formatOrderDateTime(data.deliveredAt)}
              </div>
            ) : null}

            {data.statusHistory?.length ? (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  سجل الحالة
                </h3>
                <ol className="relative flex flex-col gap-4 ps-4">
                  {data.statusHistory.map((entry, index) => {
                    const meta = SHIPMENT_STATUS_META[entry.status]
                    const isLast = index === data.statusHistory!.length - 1

                    return (
                      <li
                        key={`${entry.status}-${entry.timestamp}`}
                        className="relative flex flex-col gap-1"
                      >
                        {!isLast ? (
                          <span className="absolute -start-3 top-3 h-full w-px bg-border" />
                        ) : null}
                        <span className="absolute -start-[14px] top-1.5 size-2.5 rounded-full bg-primary" />

                        <div className="flex items-center gap-2">
                          <Truck className="size-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {meta?.label ?? entry.status}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatOrderDateTime(entry.timestamp)}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
