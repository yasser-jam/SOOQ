"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { StoreIcon } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import DataTable from "@/components/system/DataTable"
import EmptyState from "@/components/system/empty-state"

import {
  getDisableTenantMutationOptions,
  listTenantsQueryOptions,
} from "../actions"
import { sortTenantsByStatus } from "../init"
import type { TenantSummary } from "../types"
import { DisableTenantConfirm } from "./DisableTenantConfirm"
import { EditIdentityDrawer } from "./EditIdentityDrawer"
import { TenantRowActions } from "./TenantRowActions"
import { TenantStatusBadge } from "./TenantStatusBadge"
import { UpdateRateLimitDialog } from "./UpdateRateLimitDialog"
import { UpdateStatusDialog } from "./UpdateStatusDialog"

export function TenantsDataTable() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [disabledFilter, setDisabledFilter] = useState<string>("all")

  const [disableTarget, setDisableTarget] = useState<TenantSummary | null>(null)
  const [statusTarget, setStatusTarget] = useState<TenantSummary | null>(null)
  const [rateLimitTarget, setRateLimitTarget] = useState<TenantSummary | null>(null)
  const [identityTarget, setIdentityTarget] = useState<TenantSummary | null>(null)

  const { data, isLoading, isError } = useQuery(listTenantsQueryOptions())

  const { mutate: disable, isPending: isDisabling } = useMutation({
    ...getDisableTenantMutationOptions({
      queryClient,
      onSuccess: () => toast.success("تم تعطيل المتجر"),
    }),
  })

  const tenants = useMemo(() => {
    let list = sortTenantsByStatus(data ?? [])
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (t) =>
          t.storeName.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== "all") {
      list = list.filter((t) => t.storeStatus === statusFilter)
    }
    if (disabledFilter === "disabled") {
      list = list.filter((t) => t.disabled)
    } else if (disabledFilter === "active") {
      list = list.filter((t) => !t.disabled)
    }
    return list
  }, [data, search, statusFilter, disabledFilter])

  const columns = useMemo(
    () => [
      {
        accessorKey: "storeName",
        header: "المتجر",
        cell: ({ row }: { row: { original: TenantSummary } }) => (
          <Link
            href={`/tenants/${row.original.tenantId}`}
            className="flex items-center gap-3 hover:underline"
          >
            <StoreIcon className="size-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{row.original.storeName}</span>
              <span className="text-xs text-muted-foreground" dir="ltr">
                {row.original.slug}
              </span>
            </div>
          </Link>
        ),
      },
      {
        accessorKey: "storeStatus",
        header: "الحالة",
        cell: ({ row }: { row: { original: TenantSummary } }) => (
          <TenantStatusBadge
            status={row.original.storeStatus}
            disabled={row.original.disabled}
          />
        ),
      },
      {
        accessorKey: "requestsPerMinute",
        header: "حد الطلبات",
        cell: ({ row }: { row: { original: TenantSummary } }) =>
          row.original.requestsPerMinute ?? "—",
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
        id: "actions",
        header: "",
        cell: ({ row }: { row: { original: TenantSummary } }) => (
          <TenantRowActions
            tenant={row.original}
            onDisable={setDisableTarget}
            onUpdateStatus={setStatusTarget}
            onUpdateRateLimit={setRateLimitTarget}
            onEditIdentity={setIdentityTarget}
          />
        ),
      },
    ],
    []
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

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="بحث بالاسم أو الرابط…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="ACTIVE">نشط</SelectItem>
            <SelectItem value="MAINTENANCE">صيانة</SelectItem>
            <SelectItem value="PAUSED">متوقف</SelectItem>
            <SelectItem value="CLOSED">مغلق</SelectItem>
          </SelectContent>
        </Select>
        <Select value={disabledFilter} onValueChange={setDisabledFilter}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="التفعيل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="active">متاح</SelectItem>
            <SelectItem value="disabled">معطّل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={tenants}
        columns={columns}
        emptyState={
          <EmptyState
            title="لا توجد متاجر"
            description="لا توجد متاجر مطابقة للمرشحات الحالية."
          />
        }
      />

      <DisableTenantConfirm
        open={disableTarget !== null}
        storeName={disableTarget?.storeName}
        onOpenChange={(open) => {
          if (!open) setDisableTarget(null)
        }}
        onConfirm={() => {
          if (disableTarget) {
            disable(disableTarget.tenantId)
            setDisableTarget(null)
          }
        }}
      />

      <UpdateStatusDialog
        tenant={statusTarget}
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null)
        }}
      />

      <UpdateRateLimitDialog
        tenant={rateLimitTarget}
        open={rateLimitTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRateLimitTarget(null)
        }}
      />

      <EditIdentityDrawer
        tenant={identityTarget}
        open={identityTarget !== null}
        onOpenChange={(open) => {
          if (!open) setIdentityTarget(null)
        }}
      />
    </>
  )
}
