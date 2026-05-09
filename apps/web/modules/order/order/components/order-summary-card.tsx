import { Package } from "lucide-react"

import type { AdminOrderItem, AdminOrderPricing } from "@/modules/order/order/types"
import { formatOrderMoney } from "@/modules/order/order/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"

// Backend's OrderItemResponseDto exposes `quantity`, `unitPrice`, `totalPrice`,
// `productTitle`, `variantTitle`, `sku` — but no inventory health label. The
// card therefore shows ordering data (qty + price) rather than stock status,
// which lives on the inventory module page.

interface OrderSummaryCardProps {
  items?: AdminOrderItem[]
  pricing?: AdminOrderPricing | null
  currencyCode?: string
  isLoading?: boolean
}

export function OrderLineItemRow({
  item,
  isLoading,
}: {
  item?: AdminOrderItem
  isLoading: boolean
}) {
  const itemTitle =
    item?.title ?? item?.productTitle ?? item?.variantTitle ?? "عنصر الطلب"
  const itemSkuLabel = item ? `SKU: ${item.sku ?? item.variantSku ?? "—"}` : "SKU: —"
  const priceLabel = item?.priceLabel
  const quantity = item?.quantity

  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="size-20 rounded-xl">
            {item?.thumbnailUrl ? (
              <AvatarImage
                src={item.thumbnailUrl ?? item.imageUrl ?? undefined}
                alt={item.title}
                className="rounded-xl"
              />
            ) : null}
            <AvatarFallback className="rounded-full">
              <Package />
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            <p className="text-text text-lg font-semibold">{itemTitle}</p>
            <p className="text-sm text-muted-foreground">{itemSkuLabel}</p>
            {!isLoading && typeof quantity === "number" ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">الكمية</span>
                <Badge
                  variant="secondary-tonal"
                  className="h-7 px-3 text-xs"
                  dir="ltr"
                >
                  × {quantity}
                </Badge>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-28 flex-col items-start gap-1 sm:items-end">
          <span className="text-sm text-muted-foreground">السعر</span>
          {!isLoading && priceLabel ? (
            <span className="text-text-secondary text-lg font-semibold">
              {priceLabel}
            </span>
          ) : (
            <Skeleton className="h-5 w-28" />
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryValue({
  value,
  isLoading,
}: {
  value?: string
  isLoading: boolean
}) {
  if (!isLoading && value) {
    return (
      <span className="text-text-secondary text-lg font-semibold">{value}</span>
    )
  }

  return <Skeleton className="h-7 w-28" />
}

export default function OrderSummaryCard({
  items,
  pricing,
  currencyCode,
  isLoading = false,
}: OrderSummaryCardProps) {
  const resolvedItems = isLoading
    ? Array.from({ length: 2 }, () => undefined)
    : (items ?? [])
  const logisticsAndTaxes =
    (pricing?.shippingCost ?? 0) + (pricing?.taxAmount ?? 0)
  const itemsCount = isLoading ? 0 : resolvedItems?.length ?? 0

  return (
    <Card className="gap-6 py-6">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-xl">بيان الطلب</CardTitle>

          <Badge className="text-base">
            {itemsCount} عناصر
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {resolvedItems?.map((item, index) => (
          <OrderLineItemRow
            key={item?.id ?? item?.orderItemId ?? `placeholder-${index}`}
            item={item}
            isLoading={isLoading}
          />
        ))}

        {!isLoading && resolvedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-muted-foreground">
            لا توجد عناصر ضمن هذا الطلب.
          </div>
        ) : null}

        <Separator className="my-2" />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-lg text-muted-foreground">
              المجموع الفرعي
            </span>
            <SummaryValue
              value={
                pricing?.subtotalLabel ??
                formatOrderMoney(pricing?.subtotal, pricing?.currencyCode ?? currencyCode)
              }
              isLoading={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg text-muted-foreground">
              الخدمات اللوجستية والضرائب
            </span>
            <SummaryValue
              value={
                pricing?.logisticsAndTaxesLabel ??
                formatOrderMoney(logisticsAndTaxes, pricing?.currencyCode ?? currencyCode)
              }
              isLoading={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-secondary">
              المجموع الكلي
            </span>
            {!isLoading ? (
              <span className="text-xl font-bold text-secondary">
                {pricing?.totalLabel ??
                  (formatOrderMoney(
                    pricing?.total,
                    pricing?.currencyCode ?? currencyCode
                  ) || "—")}
              </span>
            ) : (
              <Skeleton className="h-8 w-36" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
