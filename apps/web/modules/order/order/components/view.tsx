"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowDown,
  ArrowUp,
  Package,
  RotateCcw,
  Truck,
  Wallet,
} from "lucide-react"

import FilterMenu from "@/components/system/filter-menu"
import { getAdminOrdersSummary } from "@/modules/order/order/actions"
import OrdersListTable from "@/modules/order/order/components/table"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import { formatOrderMoney } from "@/modules/order/order/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

type OrdersTab = "orders" | "returns"

export default function OrdersPageView() {
  const [activeTab, setActiveTab] = useState<OrdersTab>("orders")
  const { data: summary } = useQuery({
    queryKey: orderQueryKeys.summary(),
    queryFn: getAdminOrdersSummary,
  })

  const statCards = [
    {
      id: "total-orders",
      title: "إجمالي الطلبات",
      value: summary?.totalOrders?.toLocaleString("en-US") ?? "0",
      borderClassName: "border-s-4 border-s-secondary",
      iconClassName: "text-secondary/15",
      Icon: Package,
      hasTrendArrows: true,
    },
    {
      id: "returns",
      title: "طلبات الإرجاع",
      value: summary?.returnsCount?.toLocaleString("en-US") ?? "0",
      borderClassName: "border-s-4 border-s-destructive",
      iconClassName: "text-destructive/15",
      Icon: RotateCcw,
      hasTrendArrows: false,
    },
    {
      id: "in-delivery",
      title: "قيد التوصيل",
      value: summary?.inDeliveryCount?.toLocaleString("en-US") ?? "0",
      borderClassName: "border-s-4 border-s-primary",
      iconClassName: "text-primary/15",
      Icon: Truck,
      hasTrendArrows: false,
    },
    {
      id: "revenue",
      title: "إجمالي الإيرادات",
      value:
        formatOrderMoney(
          summary?.totalRevenue ?? summary?.revenue,
          summary?.currencyCode ?? "SYP"
        ) || "0",
      borderClassName: "border-s-4 border-s-emerald-500",
      iconClassName: "text-emerald-500/15",
      Icon: Wallet,
      hasTrendArrows: false,
    },
  ] as const

  return (
    <div className="container my-6 flex flex-col gap-6">
      <div className="page-title">قائمة الطلبات</div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.Icon

          return (
            <div
              key={card.id}
              className={cn(
                "relative overflow-hidden rounded-xl border bg-white p-5",
                card.borderClassName
              )}
            >
              <Icon
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -end-2 -bottom-2 size-20 p-2",
                  card.iconClassName
                )}
              />

              <div className="relative z-10 flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">
                  {card.title}
                </span>

                {card.hasTrendArrows ? (
                  <div className="flex items-center gap-3">
                    <ArrowDown className="text-destructive" />
                    <span className="text-2xl font-semibold text-foreground">
                      {card.value}
                    </span>
                    <ArrowUp className="text-emerald-600" />
                  </div>
                ) : (
                  <span className="text-2xl font-semibold text-foreground">
                    {card.value}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex w-fit items-center gap-2 rounded-xl border bg-card p-1">
        <Button
          type="button"
          size="sm"
          variant={activeTab === "orders" ? "secondary" : "ghost"}
          onClick={() => setActiveTab("orders")}
        >
          الطلبات
        </Button>

        <Button
          type="button"
          size="sm"
          variant={activeTab === "returns" ? "secondary" : "ghost"}
          onClick={() => setActiveTab("returns")}
        >
          طلبات الإرجاع
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {activeTab === "orders" ? "جدول الطلبات" : "جدول طلبات الإرجاع"}
          </h2>

          <FilterMenu>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="orders-table-filter-number">
                  رقم الطلب
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="orders-table-filter-number"
                    type="search"
                    placeholder="ابحث برقم الطلب"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="orders-table-filter-status">
                  الحالة
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="orders-table-filter-status"
                    type="search"
                    placeholder="ابحث بالحالة"
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
          </FilterMenu>
        </div>

        <OrdersListTable
          key={activeTab}
          status={activeTab === "returns" ? "RETURNED" : undefined}
        />
      </div>
    </div>
  )
}
