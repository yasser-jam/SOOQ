"use client"

import { MapPin, Star } from "lucide-react"

import { ADDRESS_LABEL_DISPLAY } from "@/modules/customer/customer/model"
import type { CustomerAddress } from "@/modules/customer/customer/types"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

interface CustomerAddressesCardProps {
  addresses?: CustomerAddress[]
  isLoading?: boolean
}

const formatAddressLine = (address: CustomerAddress): string => {
  const parts = [address.governorate, address.city, address.streetAddress]
    .filter((p) => p && p.trim())
    .join(" — ")
  return parts || "—"
}

const labelDisplay = (label: string | null): string => {
  if (!label) return "—"
  return ADDRESS_LABEL_DISPLAY[label.toUpperCase()] ?? label
}

export default function CustomerAddressesCard({
  addresses = [],
  isLoading = false,
}: CustomerAddressesCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl">
          العناوين المحفوظة
          {!isLoading && addresses.length > 0 ? (
            <span className="ms-2 text-sm font-normal text-muted-foreground">
              ({addresses.length})
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </>
        ) : addresses.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 py-8 text-center text-sm text-muted-foreground">
            لا توجد عناوين محفوظة لهذا العميل بعد.
          </div>
        ) : (
          addresses.map((address) => (
            <div
              key={address.addressId}
              className="flex flex-col gap-2 rounded-lg border bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" aria-hidden />
                  <span className="font-medium text-foreground">
                    {labelDisplay(address.label)}
                  </span>
                  {address.isDefault ? (
                    <Badge variant="default" className="gap-1">
                      <Star className="size-3" aria-hidden />
                      الافتراضي
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <div>{formatAddressLine(address)}</div>
                {address.recipientName || address.recipientPhone ? (
                  <div className="mt-1">
                    {address.recipientName ? (
                      <span>{address.recipientName}</span>
                    ) : null}
                    {address.recipientPhone ? (
                      <>
                        {address.recipientName ? <span> • </span> : null}
                        <span dir="ltr" className="font-mono">
                          {address.recipientPhone}
                        </span>
                      </>
                    ) : null}
                  </div>
                ) : null}
                {address.notes ? (
                  <div className="mt-1 text-xs italic">
                    ملاحظات: {address.notes}
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
