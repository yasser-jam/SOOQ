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
}

const STATUS_CARDS: StatusCard[] = [
  {
    id: "TOTAL",
    title: "إجمالي الطلبات",
    Icon: Package,
    borderClassName: "border-s-4 border-s-secondary",
    iconClassName: "text-secondary/15",
  },
  {
    id: "PENDING",
    status: "PENDING",
    title: "قيد الانتظار",
    Icon: Clock,
    borderClassName: "border-s-4 border-s-amber-500",
    iconClassName: "text-amber-500/15",
  },
  {
    id: "CONFIRMED",
    status: "CONFIRMED",
    title: "مؤكد",
    Icon: CheckCircle2,
    borderClassName: "border-s-4 border-s-blue-500",
    iconClassName: "text-blue-500/15",
  },
  {
    id: "PROCESSING",
    status: "PROCESSING",
    title: "قيد المعالجة",
    Icon: Cog,
    borderClassName: "border-s-4 border-s-indigo-500",
    iconClassName: "text-indigo-500/15",
  },
  {
    id: "SHIPPED",
    status: "SHIPPED",
    title: "تم الشحن",
    Icon: Truck,
    borderClassName: "border-s-4 border-s-primary",
    iconClassName: "text-primary/15",
  },
  {
    id: "DELIVERED",
    status: "DELIVERED",
    title: "تم التسليم",
    Icon: PackageCheck,
    borderClassName: "border-s-4 border-s-emerald-500",
    iconClassName: "text-emerald-500/15",
  },
  {
    id: "COMPLETED",
    status: "COMPLETED",
    title: "مكتمل",
    Icon: BadgeCheck,
    borderClassName: "border-s-4 border-s-emerald-600",
    iconClassName: "text-emerald-600/15",
  },
  {
    id: "CANCELLED",
    status: "CANCELLED",
    title: "ملغي",
    Icon: XCircle,
    borderClassName: "border-s-4 border-s-destructive",
    iconClassName: "text-destructive/15",
  },
  {
    id: "RETURNED",
    status: "RETURNED",
    title: "مرتجع",
    Icon: RotateCcw,
    borderClassName: "border-s-4 border-s-orange-500",
    iconClassName: "text-orange-500/15",
  },
  {
    id: "REFUNDED",
    status: "REFUNDED",
    title: "تم الاسترداد",
    Icon: Wallet,
    borderClassName: "border-s-4 border-s-rose-500",
    iconClassName: "text-rose-500/15",
  },
  {
    id: "FAILED",
    status: "FAILED",
    title: "فشل",
    Icon: AlertCircle,
    borderClassName: "border-s-4 border-s-red-700",
    iconClassName: "text-red-700/15",
  },
  {
    id: "REVENUE",
    title: "إجمالي الإيرادات",
    Icon: TrendingUp,
    borderClassName: "border-s-4 border-s-emerald-500",
    iconClassName: "text-emerald-500/15",
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
    <div className="container my-6 flex flex-col gap-6">
      <div className="page-title">قائمة الطلبات</div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
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
                "relative overflow-hidden rounded-xl border bg-white p-5 text-start transition",
                card.borderClassName,
                isClickable && "cursor-pointer hover:shadow-md",
                !isClickable && "cursor-default",
                isActive && "ring-2 ring-primary"
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

                <span className="text-2xl font-semibold text-foreground">
                  {getCardValue(card.id)}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              {tableTitle}
            </h2>

            {status ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={clearStatusFilter}
                className="h-7 gap-1 text-xs text-muted-foreground"
              >
                <X className="size-3" />
                إزالة الفلتر
              </Button>
            ) : null}
          </div>

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
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
          </FilterMenu>
        </div>

        <OrdersListTable status={status} searchQuery={searchQuery} />
      </div>
    </div>
  )
}
