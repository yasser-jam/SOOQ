"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { BanIcon, StoreIcon } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import ConfirmAlert from "@/components/system/confirm-alert"
import DataTable from "@/components/system/table"

import {
  getDisablePlatformTenantMutationOptions,
  listPlatformTenantsQueryOptions,
} from "../actions"
import { sortTenantsByStatus } from "../init"
import type { TenantSummary } from "../types"

export default function PlatformTenantsTable() {
  const queryClient = useQueryClient()
  const [pendingTenant, setPendingTenant] =
    React.useState<TenantSummary | null>(null)

  const { data, isLoading, isError } = useQuery(listPlatformTenantsQueryOptions())

  const { isPending: isDisabling, mutate: disable } = useMutation({
    ...getDisablePlatformTenantMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تعطيل المتجر")
      },
    }),
  })

  const tenants = React.useMemo(
    () => sortTenantsByStatus(data ?? []),
    [data]
  )

  const columns = React.useMemo(
    () => [
      {
        accessorKey: "storeName",
        header: "المتجر",
        cell: ({ row }: { row: { original: TenantSummary } }) => (
          <div className="flex items-center gap-3">
            <StoreIcon className="size-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{row.original.storeName}</span>
              <span className="text-xs text-muted-foreground" dir="ltr">
                {row.original.slug}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "storeStatus",
        header: "الحالة",
        cell: ({ row }: { row: { original: TenantSummary } }) => (
          <Badge
            variant={row.original.storeStatus === "ACTIVE" ? "secondary" : "outline"}
          >
            {row.original.storeStatus}
          </Badge>
        ),
      },
      {
        accessorKey: "disabled",
        header: "متاح؟",
        cell: ({ row }: { row: { original: TenantSummary } }) =>
          row.original.disabled ? (
            <Badge variant="destructive">معطّل</Badge>
          ) : (
            <Badge variant="secondary">متاح</Badge>
          ),
      },
      {
        accessorKey: "tenantId",
        header: "المعرّف",
        cell: ({ row }: { row: { original: TenantSummary } }) => (
          <span className="font-mono text-[10px] text-muted-foreground" dir="ltr">
            {row.original.tenantId.slice(0, 8)}…
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }: { row: { original: TenantSummary } }) => {
          if (row.original.disabled) return null
          return (
            <Button
              variant="outline"
              size="sm"
              disabled={isDisabling}
              onClick={() => setPendingTenant(row.original)}
            >
              <BanIcon className="size-4" />
              تعطيل
            </Button>
          )
        },
      },
    ],
    [isDisabling]
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
        تعذّر تحميل قائمة المتاجر.
      </div>
    )
  }

  if (tenants.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        لا توجد متاجر مسجّلة بعد.
      </div>
    )
  }

  return (
    <>
      <DataTable data={tenants} columns={columns} />

      <ConfirmAlert
        open={pendingTenant !== null}
        onOpenChange={(open) => {
          if (!open) setPendingTenant(null)
        }}
        title="تعطيل المتجر"
        description={
          pendingTenant
            ? `سيتم تعطيل "${pendingTenant.storeName}" وإغلاقه نهائياً (HTTP 410). لا يمكن التراجع عن هذه العملية من نفس الصفحة.`
            : ""
        }
        actionLabel="تعطيل"
        variant="destructive"
        onAction={() => {
          if (pendingTenant) {
            disable(pendingTenant.tenantId)
            setPendingTenant(null)
          }
        }}
      />
    </>
  )
}
