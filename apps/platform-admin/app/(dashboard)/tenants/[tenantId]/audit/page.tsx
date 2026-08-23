"use client"

import { use } from "react"

import { PageHeader } from "@/components/system/PageHeader"
import { AuditLogTable } from "@/modules/audit/components/AuditLogTable"
import { listTenantsQueryOptions } from "@/modules/tenants/actions"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@workspace/ui/components/skeleton"

export default function TenantAuditPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = use(params)
  const { data: tenants, isLoading } = useQuery(listTenantsQueryOptions())
  const tenant = tenants?.find((t) => t.tenantId === tenantId)

  if (isLoading) return <Skeleton className="h-24 w-full" />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`سجل التدقيق — ${tenant?.storeName ?? tenantId.slice(0, 8)}`}
        description="عمليات هذا المتجر فقط"
      />
      <AuditLogTable tenantId={tenantId} />
    </div>
  )
}
