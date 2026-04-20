import { Package } from "lucide-react"

import type {
  OrderLineItemModel,
  OrderPricingModel,
} from "@/modules/order/order/model"
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

interface OrderSummaryCardProps {
  items?: OrderLineItemModel[]
  pricing?: OrderPricingModel
  isLoading?: boolean
}

const DUMMY_ITEMS: OrderLineItemModel[] = [
  {
    id: "dummy-item-1",
    title: "قميص قطني كلاسيكي",
    sku: "SHIRT-001",
    quantity: 1,
    priceLabel: "120 ر.س",
    inventoryLabel: "متوفر",
    thumbnailUrl: null,
  },
  {
    id: "dummy-item-2",
    title: "حقيبة يد يومية",
    sku: "BAG-204",
    quantity: 1,
    priceLabel: "95 ر.س",
    inventoryLabel: "مخزون منخفض",
    thumbnailUrl: null,
  },
]

const DUMMY_PRICING: OrderPricingModel = {
  subtotalLabel: "215 ر.س",
  logisticsAndTaxesLabel: "25 ر.س",
  totalLabel: "240 ر.س",
}

export function OrderLineItemRow({
  item,
  isLoading,
}: {
  item?: OrderLineItemModel
  isLoading: boolean
}) {
  const itemTitle = item?.title ?? "عنصر الطلب"
  const itemSkuLabel = item ? `SKU: ${item.sku}` : "SKU: —"
  const inventoryLabel = item?.inventoryLabel ?? "غير محدد"
  const priceLabel = item?.priceLabel

  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="size-20 rounded-xl">
            {item?.thumbnailUrl ? (
              <AvatarImage
                src={item.thumbnailUrl}
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                حالة المخزون
              </span>
              {!isLoading && item ? (
                <Badge variant="secondary-tonal" className="h-7 px-3 text-xs">
                  {inventoryLabel}
                </Badge>
              ) : (
                <Skeleton className="h-7 w-24 rounded-4xl" />
              )}
            </div>
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
  isLoading = false,
}: OrderSummaryCardProps) {
  const hasItems = Boolean(items?.length)
  const resolvedItems = isLoading
    ? Array.from({ length: 2 }, () => undefined)
    : hasItems
      ? items
      : DUMMY_ITEMS
  const resolvedPricing = pricing ?? DUMMY_PRICING
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
            key={item?.id ?? `placeholder-${index}`}
            item={item}
            isLoading={isLoading}
          />
        ))}

        <Separator className="my-2" />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-lg text-muted-foreground">
              المجموع الفرعي
            </span>
            <SummaryValue
              value={resolvedPricing.subtotalLabel}
              isLoading={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg text-muted-foreground">
              الخدمات اللوجستية والضرائب
            </span>
            <SummaryValue
              value={resolvedPricing.logisticsAndTaxesLabel}
              isLoading={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-secondary">
              المجموع الكلي
            </span>
            {!isLoading ? (
              <span className="text-xl font-bold text-secondary">
                {resolvedPricing.totalLabel}
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
