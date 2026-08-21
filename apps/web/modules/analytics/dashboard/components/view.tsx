"use client"

import { useMemo, useState, type ComponentType } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, ShoppingBag, Users, Wallet } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import EmptyState from "@/components/system/empty-state"
import { useStorePath } from "@/lib/store-path"
import { formatSyp } from "@/lib/money"

import { getStoreSettingsQueryOptions } from "@/modules/store/settings/actions"
import { listProducts } from "@/modules/product/product/actions"
import { productKeys } from "@/modules/product/product/queryKeys"
import { listBuilds } from "@/modules/app/build/actions"
import { appBuildKeys } from "@/modules/app/build/queryKeys"
import { getPublishedDesignConfigQueryOptions } from "@/modules/design-studio/actions"
import { getAdminOrdersSummary } from "@/modules/order/order/actions"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import OrdersListTable from "@/modules/order/order/components/table"
import { AnalyticsRevenueChart } from "@/modules/analytics/analytics/components/revenue-chart"

import { getDashboardAnalyticsQueryOptions } from "../actions"
import type { DashboardPeriod } from "../types"
import { DashboardPeriodSelect } from "./period-select"
import { StepsCard, type StepItem } from "./steps-card"
import { QuickActionsCard } from "./quick-actions-card"
import { OrderStatusCard, TopProductsCard } from "./insights-cards"

const StatCard = ({
  icon: Icon,
  label,
  value,
  sublabel,
  loading,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  sublabel?: string
  loading?: boolean
}) => (
  <Card size="sm" className="gap-3">
    <CardHeader className="flex-row items-center justify-between p-0">
      <CardTitle className="text-muted-foreground text-sm font-medium">
        {label}
      </CardTitle>
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </span>
    </CardHeader>
    <CardContent className="space-y-1.5 p-0">
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <>
          <div className="font-heading text-[26px] leading-8 font-bold tabular-nums">
            {value}
          </div>
          {sublabel && (
            <div className="text-muted-foreground text-xs">{sublabel}</div>
          )}
        </>
      )}
    </CardContent>
  </Card>
)

export function HomeDashboardView() {
  const storePath = useStorePath()
  const [period, setPeriod] = useState<DashboardPeriod>("WEEK")

  const { data: settings } = useQuery(getStoreSettingsQueryOptions())
  const dashboardQuery = useQuery(getDashboardAnalyticsQueryOptions(period))

  const themeQuery = useQuery({
    ...getPublishedDesignConfigQueryOptions(settings?.tenantId ?? "", "web"),
    enabled: Boolean(settings?.tenantId),
  })
  const productsQuery = useQuery({
    queryKey: productKeys.all,
    queryFn: listProducts,
  })
  const buildsQuery = useQuery({
    queryKey: appBuildKeys.list(),
    queryFn: () => listBuilds({ page: 0, size: 1 }),
  })
  const ordersSummaryQuery = useQuery({
    queryKey: orderQueryKeys.summary(),
    queryFn: getAdminOrdersSummary,
  })

  const steps: StepItem[] = [
    {
      key: "store",
      title: "إنشاء المتجر",
      desc: "أعدّ متجرك واختر ثيمًا ثم انشره من استوديو التصميم.",
      done: Boolean(themeQuery.data),
      cta: "اذهب إلى استوديو التصميم",
      ctaHref: storePath("/design-studio"),
    },
    {
      key: "products",
      title: "إضافة أول منتج",
      desc: "أضف منتجات إلى الكتالوج ليراها عملاؤك.",
      done: (productsQuery.data?.data?.length ?? 0) > 0,
      cta: "إضافة منتج",
      ctaHref: storePath("/products/create"),
    },
    {
      key: "app-build",
      title: "إنشاء تطبيق الجوال",
      desc: "أنشئ تطبيقًا يعكس ثيم متجرك تلقائيًا.",
      done: (buildsQuery.data?.content?.length ?? 0) > 0,
      cta: "ابدأ الآن",
      ctaHref: storePath("/design-studio"),
    },
    {
      key: "orders",
      title: "استلام أول طلب",
      desc: "شارك رابط متجرك لتصل أول عملية شراء.",
      done: ((ordersSummaryQuery.data?.total ?? ordersSummaryQuery.data?.totalOrders) ?? 0) > 0,
    },
  ]
  const stepsLoading =
    themeQuery.isPending ||
    productsQuery.isPending ||
    buildsQuery.isPending ||
    ordersSummaryQuery.isPending

  const revenueSeries = useMemo(
    () => dashboardQuery.data?.revenueSeries ?? [],
    [dashboardQuery.data]
  )
  const previousRevenueSeries = useMemo(
    () => dashboardQuery.data?.previousRevenueSeries ?? [],
    [dashboardQuery.data]
  )

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="page-title mb-2.5">
            أهلاً بك{settings?.storeName ? `، ${settings.storeName}` : ""} 👋
          </h1>
          <p className="text-muted-foreground max-w-xl text-[15px] leading-7">
            هذه نظرة سريعة على متجرك. أكمل خطوات التهيئة لتبدأ البيع بشكل كامل.
          </p>
        </div>
        <div className="border-border bg-card flex items-center gap-2.5 rounded-xl border px-4.5 py-3">
          <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold">المتجر يعمل</span>
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-text font-heading text-xl font-semibold">
            ملخص سريع
          </h2>
          <DashboardPeriodSelect value={period} onChange={setPeriod} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={ShoppingBag}
            label="الطلبات"
            value={String(dashboardQuery.data?.orderCount ?? 0)}
            loading={dashboardQuery.isPending}
          />
          <StatCard
            icon={Wallet}
            label="الإيرادات"
            value={formatSyp(dashboardQuery.data?.revenueTotal ?? 0)}
            loading={dashboardQuery.isPending}
          />
          <StatCard
            icon={Users}
            label="عملاء جدد"
            value={String(dashboardQuery.data?.customerGrowth.newCustomersThisWeek ?? 0)}
            sublabel={
              dashboardQuery.data
                ? `${dashboardQuery.data.customerGrowth.growthPercent >= 0 ? "+" : ""}${dashboardQuery.data.customerGrowth.growthPercent}٪ مقارنة بالأسبوع الماضي`
                : undefined
            }
            loading={dashboardQuery.isPending}
          />
          <StatCard
            icon={AlertTriangle}
            label="تنبيهات مخزون منخفض"
            value={String(dashboardQuery.data?.lowStockAlerts.length ?? 0)}
            loading={dashboardQuery.isPending}
          />
        </div>
      </section>

      <Card size="sm" className="gap-4">
        <CardHeader className="p-0">
          <CardTitle className="text-lg">الإيرادات عبر الزمن</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dashboardQuery.isPending ? (
            <Skeleton className="h-72 w-full rounded-xl" />
          ) : revenueSeries.length ? (
            <AnalyticsRevenueChart
              current={revenueSeries}
              previous={previousRevenueSeries}
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

      <section className="grid gap-6 lg:grid-cols-2">
        <TopProductsCard
          products={dashboardQuery.data?.topProducts ?? []}
          loading={dashboardQuery.isPending}
        />
        <OrderStatusCard
          breakdown={dashboardQuery.data?.orderStatusBreakdown ?? []}
          loading={dashboardQuery.isPending}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <StepsCard steps={steps} loading={stepsLoading} />
        <QuickActionsCard storePath={storePath} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-text font-heading text-xl font-semibold">
            أحدث الطلبات
          </h2>
          <Button variant="link" size="sm" className="h-auto p-0 text-sm" asChild>
            <Link href={storePath("/orders")}>كل الطلبات</Link>
          </Button>
        </div>
        <OrdersListTable />
      </section>
    </div>
  )
}
