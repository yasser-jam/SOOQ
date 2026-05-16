"use client"

import { Mail, MessageSquare, Phone, Calendar } from "lucide-react"

import type { AdminCustomerDetail } from "@/modules/customer/customer/types"
import {
  formatDateArabic,
  formatRelativeArabic,
  formatSpendSyp,
} from "@/modules/customer/customer/utils"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

interface CustomerSummaryCardProps {
  customer?: AdminCustomerDetail
  isLoading?: boolean
}

export default function CustomerSummaryCard({
  customer,
  isLoading = false,
}: CustomerSummaryCardProps) {
  if (isLoading || !customer) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-6 py-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const kpis = [
    {
      label: "الطلبات",
      value: customer.orderCount?.toString() ?? "0",
    },
    {
      label: "إجمالي الإنفاق",
      value: `${formatSpendSyp(customer.totalSpendSyp)} ل.س`,
    },
    {
      label: "آخر طلب",
      value: customer.lastOrderAt
        ? formatDateArabic(customer.lastOrderAt)
        : "لا يوجد",
    },
    {
      label: "منذ",
      value: customer.lastOrderAt
        ? formatRelativeArabic(customer.lastOrderAt)
        : "—",
    },
  ]

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold text-foreground">
              {customer.fullName || "بدون اسم"}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="size-4" aria-hidden />
              <span dir="ltr" className="font-mono">
                {customer.phone || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="size-3.5" aria-hidden />
              مسجَّل منذ {formatDateArabic(customer.createdAt)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={customer.preferences?.emailOptIn ? "default" : "outline"}
              className="gap-1"
            >
              <Mail className="size-3" aria-hidden />
              بريد {customer.preferences?.emailOptIn ? "مفعّل" : "غير مفعّل"}
            </Badge>
            <Badge
              variant={customer.preferences?.smsOptIn ? "default" : "outline"}
              className="gap-1"
            >
              <MessageSquare className="size-3" aria-hidden />
              SMS {customer.preferences?.smsOptIn ? "مفعّل" : "غير مفعّل"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-4"
            >
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
              <span className="text-lg font-semibold text-foreground">
                {kpi.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
