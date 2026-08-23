"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import Link from "next/link"
import { use, useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/system/PageHeader"
import {
  getDisableTenantMutationOptions,
  listTenantsQueryOptions,
} from "@/modules/tenants/actions"
import { DisableTenantConfirm } from "@/modules/tenants/components/DisableTenantConfirm"
import { EditIdentityDrawer } from "@/modules/tenants/components/EditIdentityDrawer"
import { TenantStatusBadge } from "@/modules/tenants/components/TenantStatusBadge"
import { UpdateRateLimitDialog } from "@/modules/tenants/components/UpdateRateLimitDialog"
import { UpdateStatusDialog } from "@/modules/tenants/components/UpdateStatusDialog"

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = use(params)
  const queryClient = useQueryClient()
  const { data: tenants, isLoading } = useQuery(listTenantsQueryOptions())
  const tenant = tenants?.find((t) => t.tenantId === tenantId)

  const { mutate: disableTenant } = useMutation({
    ...getDisableTenantMutationOptions({
      queryClient,
      onSuccess: () => toast.success("تم تعطيل المتجر"),
    }),
  })

  const [showDisable, setShowDisable] = useState(false)
  const [showStatus, setShowStatus] = useState(false)
  const [showRateLimit, setShowRateLimit] = useState(false)
  const [showIdentity, setShowIdentity] = useState(false)

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />
  }

  if (!tenant) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        المتجر غير موجود.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tenant.storeName}
        description={tenant.slug}
        actions={
          <Button asChild variant="outline">
            <Link href={`/tenants/${tenantId}/audit`}>سجل التدقيق</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الهوية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">الاسم: </span>
              {tenant.storeName}
            </p>
            <p dir="ltr">
              <span className="text-muted-foreground">الرابط: </span>
              {tenant.slug}
            </p>
            <p>
              <span className="text-muted-foreground">العملة: </span>
              {tenant.primaryCurrencyCode ?? "SYP"}
            </p>
            <Button size="sm" variant="secondary" onClick={() => setShowIdentity(true)}>
              تعديل الهوية
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">الحالة والحدود</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <TenantStatusBadge
                status={tenant.storeStatus}
                disabled={tenant.disabled}
              />
            </div>
            <p>
              <span className="text-muted-foreground">حد الطلبات: </span>
              {tenant.requestsPerMinute ?? "—"} / دقيقة
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShowStatus(true)}>
                تغيير الحالة
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowRateLimit(true)}>
                حد الطلبات
              </Button>
              {!tenant.disabled ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowDisable(true)}
                >
                  تعطيل
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <DisableTenantConfirm
        open={showDisable}
        storeName={tenant.storeName}
        onOpenChange={setShowDisable}
        onConfirm={() => {
          disableTenant(tenantId)
          setShowDisable(false)
        }}
      />
      <UpdateStatusDialog
        tenant={tenant}
        open={showStatus}
        onOpenChange={setShowStatus}
      />
      <UpdateRateLimitDialog
        tenant={tenant}
        open={showRateLimit}
        onOpenChange={setShowRateLimit}
      />
      <EditIdentityDrawer
        tenant={tenant}
        open={showIdentity}
        onOpenChange={setShowIdentity}
      />
    </div>
  )
}
