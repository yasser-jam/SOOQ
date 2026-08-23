"use client"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Building2Icon, ShieldAlertIcon, WrenchIcon } from "lucide-react"
import Link from "next/link"

import { PageHeader } from "@/components/system/PageHeader"
import { listAuditLogsQueryOptions } from "@/modules/audit/actions"
import { listTenantsQueryOptions } from "@/modules/tenants/actions"

export default function DashboardPage() {
  const { data: tenants, isLoading: tenantsLoading } = useQuery(
    listTenantsQueryOptions()
  )
  const { data: audit, isLoading: auditLoading } = useQuery(
    listAuditLogsQueryOptions({ page: 0, size: 5 })
  )

  const total = tenants?.length ?? 0
  const active = tenants?.filter((t) => !t.disabled && t.storeStatus === "ACTIVE").length ?? 0
  const maintenance =
    tenants?.filter((t) => t.storeStatus === "MAINTENANCE").length ?? 0
  const disabled = tenants?.filter((t) => t.disabled).length ?? 0

  const kpis = [
    { label: "إجمالي المتاجر", value: total, icon: Building2Icon },
    { label: "نشطة", value: active, icon: Building2Icon },
    { label: "في الصيانة", value: maintenance, icon: WrenchIcon },
    { label: "معطّلة", value: disabled, icon: ShieldAlertIcon },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="لوحة التحكم"
        description="نظرة عامة على متاجر المنصة"
        actions={
          <Button asChild variant="secondary">
            <Link href="/tenants">إدارة المتاجر</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
              <kpi.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {tenantsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{kpi.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">آخر عمليات التدقيق</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : audit?.content.length ? (
            <ul className="space-y-2 text-sm">
              {audit.content.map((entry) => (
                <li
                  key={entry.auditId}
                  className="flex items-center justify-between border-b py-2 last:border-0"
                >
                  <span>{entry.action}</span>
                  <span className="text-xs text-muted-foreground">
                    {entry.entityType}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد عمليات حديثة.</p>
          )}
          <Button asChild variant="link" className="mt-4 px-0">
            <Link href="/audit-log">عرض السجل الكامل</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
