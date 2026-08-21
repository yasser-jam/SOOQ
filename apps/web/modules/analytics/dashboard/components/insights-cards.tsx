"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import EmptyState from "@/components/system/empty-state"
import { formatSyp } from "@/lib/money"
import { ORDER_STATUS_META } from "@/lib/domain-enums"

import type { DashboardOrderStatusCount, DashboardTopProduct } from "../types"

type TopProductsCardProps = {
  products: DashboardTopProduct[]
  loading?: boolean
}

export function TopProductsCard({ products, loading }: TopProductsCardProps) {
  return (
    <Card size="sm" className="gap-4">
      <CardHeader className="p-0">
        <CardTitle className="text-lg">الأكثر مبيعًا</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : products.length ? (
          <div className="space-y-1">
            {products.map((product, index) => (
              <div
                key={product.variantId}
                className="border-border/70 flex items-center gap-3 border-t py-3 first:border-t-0"
              >
                <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate text-sm font-bold">
                    {product.productTitle || product.sku}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {product.quantitySold} قطعة مباعة
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums">
                  {formatSyp(product.revenue)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="لا توجد مبيعات بعد" compact />
        )}
      </CardContent>
    </Card>
  )
}

type OrderStatusCardProps = {
  breakdown: DashboardOrderStatusCount[]
  loading?: boolean
}

export function OrderStatusCard({ breakdown, loading }: OrderStatusCardProps) {
  return (
    <Card size="sm" className="gap-4">
      <CardHeader className="p-0">
        <CardTitle className="text-lg">حالة الطلبات</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : breakdown.length ? (
          <div className="space-y-1">
            {breakdown.map((item) => {
              const meta = ORDER_STATUS_META[item.status]
              return (
                <div
                  key={item.status}
                  className="border-border/70 flex items-center gap-3 border-t py-3 first:border-t-0"
                >
                  <Badge variant={meta?.badgeVariant}>
                    {meta?.label ?? item.status}
                  </Badge>
                  <span className="flex-1" />
                  <span className="text-sm font-bold tabular-nums">
                    {item.count}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState title="لا توجد طلبات خلال هذه الفترة" compact />
        )}
      </CardContent>
    </Card>
  )
}
