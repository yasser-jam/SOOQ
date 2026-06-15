"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Cog,
  Package,
  PackageCheck,
  RotateCcw,
  TrendingUp,
  Truck,
  Wallet,
  X,
  XCircle,
} from "lucide-react"

import { ORDER_STATUS_META, type OrderStatus } from "@/lib/domain-enums"
import { formatSyp } from "@/lib/money"
import FilterMenu from "@/components/system/filter-menu"
import { getAdminOrdersSummary } from "@/modules/order/order/actions"
import OrdersListTable from "@/modules/order/order/components/table"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

type StatusCardId = OrderStatus | "TOTAL" | "REVENUE"

type StatusCard = {
  id: StatusCardId
  status?: OrderStatus
  title: string
  Icon: typeof Package
  borderClassName: string
  iconClassName: string
  bgClassName: string
}

const STATUS_CARDS: StatusCard[] = [
  {
    id: "PENDING",
    status: "PENDING",
    title: "قيد الانتظار",
    Icon: Clock,
    borderClassName: "border border-gray-200",
    iconClassName: "text-amber-500",
    bgClassName: "bg-amber-50",
  },
  {
    id: "DELIVERED",
    status: "DELIVERED",
    title: "تم التسليم",
    Icon: PackageCheck,
    borderClassName: "border border-gray-200",
    iconClassName: "text-emerald-500",
    bgClassName: "bg-emerald-50",
  },
  {
    id: "CANCELLED",
    status: "CANCELLED",
    title: "ملغي",
    Icon: XCircle,
    borderClassName: "border border-gray-200",
    iconClassName: "text-red-500",
    bgClassName: "bg-red-50",
  },
  {
    id: "TOTAL",
    title: "إجمالي الطلبات",
    Icon: Package,
    borderClassName: "border border-gray-200",
    iconClassName: "text-secondary",
    bgClassName: "bg-gray-50",
  },
  {
    id: "REVENUE",
    title: "إجمالي الإيرادات",
    Icon: TrendingUp,
    borderClassName: "border border-gray-200",
    iconClassName: "text-emerald-600",
    bgClassName: "bg-emerald-50",
  },
]

const isOrderStatus = (value: string | null): value is OrderStatus =>
  value !== null && value in ORDER_STATUS_META

export default function OrdersPageView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const statusParam = searchParams.get("status")
  const status = isOrderStatus(statusParam) ? statusParam : undefined

  const [searchQuery, setSearchQuery] = useState("")

  const { data: summary } = useQuery({
    queryKey: orderQueryKeys.summary(),
    queryFn: getAdminOrdersSummary,
  })

  const getCardValue = (id: StatusCardId): string => {
    if (!summary) return "0"

    if (id === "TOTAL") {
      return (summary.total ?? summary.totalOrders ?? 0).toLocaleString("en-US")
    }

    if (id === "REVENUE") {
      return (
        formatSyp(summary.totalRevenue ?? summary.revenue ?? 0) || "0"
      )
    }

    const key = id.toLowerCase() as keyof typeof summary
    const count = (summary[key] as number | undefined) ?? 0

    return count.toLocaleString("en-US")
  }

  const handleCardClick = (card: StatusCard) => {
    if (card.id === "REVENUE") return

    const params = new URLSearchParams(searchParams.toString())

    if (card.status) {
      params.set("status", card.status)
    } else {
      params.delete("status")
    }

    const query = params.toString()
    router.push(query ? `/orders?${query}` : "/orders")
  }

  const clearStatusFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("status")

    const query = params.toString()
    router.push(query ? `/orders?${query}` : "/orders")
  }

  const tableTitle = status
    ? `جدول الطلبات — ${ORDER_STATUS_META[status].label}`
    : "جدول الطلبات"

  return (
    <div className="container my-6 flex flex-col gap-8">
      <div className="page-title">قائمة الطلبات</div>

      {/* القسم العلوي (KPIs) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
        {STATUS_CARDS.map((card) => {
          const Icon = card.Icon
          const isActive = card.status && card.status === status
          const isClickable = card.id !== "REVENUE"

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCardClick(card)}
              disabled={!isClickable}
              className={cn(
                "relative overflow-hidden rounded-xl border p-6 text-start transition shadow-sm",
                card.borderClassName,
                card.bgClassName,
                isClickable && "cursor-pointer hover:shadow-md",
                !isClickable && "cursor-default",
                isActive && "ring-2 ring-offset-2",
                isActive && "ring-[#BA7B1B]"
              )}
            >
              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Icon
                    aria-hidden
                    className={cn("size-6", card.iconClassName)}
                  />
                  {card.id === "PENDING" && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                      +5%
                    </span>
                  )}
                  {card.id === "DELIVERED" && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                      +12%
                    </span>
                  )}
                  {card.id === "CANCELLED" && (
                    <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                      -2%
                    </span>
                  )}
                  {card.id === "REVENUE" && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                      +8%
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium" style={{ color: "#122640" }}>
                    {card.title}
                  </span>

                  <span className="text-3xl font-bold" style={{ color: "#122640" }}>
                    {getCardValue(card.id)}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* القسم السفلي (Management) */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold" style={{ color: "#122640" }}>
              {tableTitle}
            </h2>

            {status ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={clearStatusFilter}
                className="h-8 gap-1 text-xs text-muted-foreground"
              >
                <X className="size-3" />
                إزالة الفلتر
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
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
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-lg"
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            </FilterMenu>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
            >
              تصدير الطلبات
            </Button>
          </div>
        </div>

        <OrdersListTable status={status} searchQuery={searchQuery} />
      </div>
    </div>
  )
}
