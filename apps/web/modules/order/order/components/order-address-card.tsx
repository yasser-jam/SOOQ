"use client"

import { MapPin as MapPinIcon, Phone, UserRound } from "lucide-react"

import MapPin from "@/components/system/map-pin"
import type { AdminOrder } from "@/modules/order/order/types"
import { getOrderShippingAddress } from "@/modules/order/order/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

interface OrderAddressCardProps {
  order?: AdminOrder
  isLoading?: boolean
}

export default function OrderAddressCard({
  order,
  isLoading = false,
}: OrderAddressCardProps) {
  const address = getOrderShippingAddress(order)
  const latitude = address?.latitude
  const longitude = address?.longitude
  const recipientName =
    address?.recipientName ?? address?.name ?? order?.customerName
  const phone = address?.phone ?? order?.customer?.phone
  const addressLabel = address?.addressLabel ?? address?.details
  const hasCoords = typeof latitude === "number" && typeof longitude === "number"

  return (
    <Card className="h-full gap-4 rounded-3xl py-6">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl">عنوان الشحن</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <Skeleton className="h-60 w-full rounded-lg" />
        ) : hasCoords ? (
          <MapPin
            latitude={latitude}
            longitude={longitude}
            height={240}
            className="rounded-2xl"
          />
        ) : (
          <div className="flex h-60 items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
            لا توجد إحداثيات لعنوان الشحن
          </div>
        )}

        <div className="grid gap-3 text-sm">
          <div className="flex items-center gap-3">
            <UserRound className="size-4 text-muted-foreground" />
            {isLoading ? (
              <Skeleton className="h-5 w-40" />
            ) : (
              <span className="text-base font-medium text-foreground">
                {recipientName ?? "—"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Phone className="size-4 text-muted-foreground" />
            {isLoading ? (
              <Skeleton className="h-5 w-32" />
            ) : phone ? (
              <span className="font-mono" dir="ltr">
                {phone}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>

          {addressLabel ? (
            <div className="flex items-start gap-3">
              <MapPinIcon className="mt-0.5 size-4 text-muted-foreground" />
              <span className="text-foreground">{addressLabel}</span>
            </div>
          ) : null}

          {hasCoords ? (
            <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground">
              <span dir="ltr">{latitude.toFixed(6)}</span>
              <span>·</span>
              <span dir="ltr">{longitude.toFixed(6)}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
