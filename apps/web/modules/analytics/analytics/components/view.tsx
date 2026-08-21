"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { formatSyp } from "@/lib/money"
import EmptyState from "@/components/system/empty-state"

import {
  getFxImpactAnalyticsQueryOptions,
  getProfitAnalyticsQueryOptions,
  getRevenueAnalyticsQueryOptions,
} from "../actions"
import type { AnalyticsPeriod } from "../types"
import { AnalyticsExportButtons } from "./export-buttons"
import { AnalyticsFxImpactCard } from "./fx-impact-card"
import { AnalyticsPeriodSelect } from "./period-select"
import { ProfitMarginChart } from "./profit-margin-chart"
import { AnalyticsRevenueChart } from "./revenue-chart"

const StatCard = ({
  label,
  value,
}: {
  label: string
  value: string
}) => (
  <Card size="sm" className="gap-2">
    <CardHeader className="p-0">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="font-heading text-2xl font-bold tabular-nums">
        {value}
      </div>
    </CardContent>
  </Card>
)

export default function AnalyticsPageView() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("WEEK")

  const revenueQuery = useQuery(getRevenueAnalyticsQueryOptions(period))
  const profitQuery = useQuery(getProfitAnalyticsQueryOptions(period))
  const fxImpactQuery = useQuery(getFxImpactAnalyticsQueryOptions(period))

  return (
    <div className="container space-y-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="page-title">التحليلات</div>
        <div className="flex flex-wrap items-center gap-3">
          <AnalyticsPeriodSelect value={period} onChange={setPeriod} />
          <AnalyticsExportButtons period={period} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {profitQuery.isPending ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-2xl" />
          ))
        ) : profitQuery.data ? (
          <>
            <StatCard
              label="إجمالي الإيرادات"
              value={formatSyp(profitQuery.data.revenueTotal)}
            />
            <StatCard
              label="التكلفة المقدّرة"
              value={formatSyp(profitQuery.data.estimatedCostTotal)}
            />
            <StatCard
              label="إجمالي الربح"
              value={formatSyp(profitQuery.data.grossProfit)}
            />
            <StatCard
              label="نسبة الهامش"
              value={`${profitQuery.data.marginPercent}٪`}
            />
          </>
        ) : null}
      </div>

      <Card size="sm" className="gap-4">
        <CardHeader className="p-0">
          <CardTitle className="text-lg">الإيرادات عبر الزمن</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {revenueQuery.isPending ? (
            <Skeleton className="h-72 w-full rounded-xl" />
          ) : revenueQuery.data?.current.length ? (
            <AnalyticsRevenueChart
              current={revenueQuery.data.current}
              previous={revenueQuery.data.previous}
            />
          ) : (
            <EmptyState
              title="لا توجد بيانات إيرادات"
              description="لا توجد بيانات لعرضها خلال هذه الفترة"
              compact
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card size="sm" className="gap-4">
          <CardHeader className="p-0">
            <CardTitle className="text-lg">أفضل المنتجات هامشًا</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {profitQuery.isPending ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : profitQuery.data?.bestMarginProducts.length ? (
              <ProfitMarginChart products={profitQuery.data.bestMarginProducts} />
            ) : (
              <EmptyState title="لا توجد بيانات" compact />
            )}
          </CardContent>
        </Card>

        <Card size="sm" className="gap-4">
          <CardHeader className="p-0">
            <CardTitle className="text-lg">أضعف المنتجات هامشًا</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {profitQuery.isPending ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : profitQuery.data?.worstMarginProducts.length ? (
              <ProfitMarginChart products={profitQuery.data.worstMarginProducts} />
            ) : (
              <EmptyState title="لا توجد بيانات" compact />
            )}
          </CardContent>
        </Card>
      </div>

      {fxImpactQuery.isPending ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : fxImpactQuery.data ? (
        <AnalyticsFxImpactCard data={fxImpactQuery.data} />
      ) : null}
    </div>
  )
}
