"use client"

import { useQuery } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field as UiField,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ChevronDownIcon, FilterXIcon } from "lucide-react"
import * as React from "react"

import DataTable from "@/components/system/DataTable"

import { listAuditLogsQueryOptions } from "../actions"
import {
  auditLogFiltersDefaultValues,
  isFilterActive,
  tryFormatJson,
} from "../init"
import type { AuditLogEntry, AuditLogFilters } from "../types"

const formatDateTime = (value?: string | null): string => {
  if (!value) return "—"
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value))
  } catch {
    return value
  }
}

const ChangeCell = ({ label, value }: { label: string; value?: string | null }) => {
  const [open, setOpen] = React.useState(false)
  if (!value) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 w-fit gap-1 px-1 text-xs"
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronDownIcon
          className={`size-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
        {label}
      </Button>
      {open ? (
        <pre
          className="max-w-xs overflow-auto rounded-md border bg-muted/40 p-2 font-mono text-[11px]"
          dir="ltr"
        >
          {tryFormatJson(value)}
        </pre>
      ) : null}
    </div>
  )
}

type AuditLogTableProps = {
  tenantId?: string
}

export function AuditLogTable({ tenantId }: AuditLogTableProps) {
  const [filters, setFilters] = React.useState<AuditLogFilters>(
    auditLogFiltersDefaultValues
  )
  const [draftAction, setDraftAction] = React.useState("")
  const [draftActorUserId, setDraftActorUserId] = React.useState("")
  const [draftFrom, setDraftFrom] = React.useState("")
  const [draftTo, setDraftTo] = React.useState("")

  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFilters({
      action: draftAction,
      actorUserId: draftActorUserId,
      from: draftFrom,
      to: draftTo,
      page: 0,
      size: filters.size,
    })
  }

  const clearFilters = () => {
    setDraftAction("")
    setDraftActorUserId("")
    setDraftFrom("")
    setDraftTo("")
    setFilters(auditLogFiltersDefaultValues)
  }

  const { data, isLoading, isError, isFetching } = useQuery(
    listAuditLogsQueryOptions(filters)
  )

  const rows = React.useMemo(() => {
    const content = data?.content ?? []
    if (!tenantId) return content
    return content.filter((entry) => entry.tenantId === tenantId)
  }, [data?.content, tenantId])

  const pageCount = data?.totalPages ?? 1

  const columns = React.useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: "التاريخ",
        cell: ({ row }: { row: { original: AuditLogEntry } }) => (
          <span className="text-xs">{formatDateTime(row.original.createdAt)}</span>
        ),
      },
      {
        accessorKey: "action",
        header: "العملية",
        cell: ({ row }: { row: { original: AuditLogEntry } }) => (
          <Badge variant="secondary">{row.original.action}</Badge>
        ),
      },
      {
        accessorKey: "entityType",
        header: "الكيان",
        cell: ({ row }: { row: { original: AuditLogEntry } }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs">{row.original.entityType}</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {row.original.entityId.slice(0, 8)}…
            </span>
          </div>
        ),
      },
      {
        accessorKey: "actorUserId",
        header: "المستخدم",
        cell: ({ row }: { row: { original: AuditLogEntry } }) => (
          <span className="font-mono text-[10px] text-muted-foreground">
            {row.original.actorUserId.slice(0, 8)}…
          </span>
        ),
      },
      {
        accessorKey: "oldValue",
        header: "قبل",
        cell: ({ row }: { row: { original: AuditLogEntry } }) => (
          <ChangeCell label="عرض" value={row.original.oldValue} />
        ),
      },
      {
        accessorKey: "newValue",
        header: "بعد",
        cell: ({ row }: { row: { original: AuditLogEntry } }) => (
          <ChangeCell label="عرض" value={row.original.newValue} />
        ),
      },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-4">
      {!tenantId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المرشحات</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={applyFilters}
              className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4"
            >
              <UiField>
                <FieldLabel htmlFor="filter-action">العملية</FieldLabel>
                <Input
                  id="filter-action"
                  placeholder="CREATE / UPDATE / DELETE"
                  value={draftAction}
                  onChange={(e) => setDraftAction(e.target.value)}
                />
              </UiField>
              <UiField>
                <FieldLabel htmlFor="filter-actor">معرّف المستخدم</FieldLabel>
                <Input
                  id="filter-actor"
                  placeholder="UUID"
                  value={draftActorUserId}
                  onChange={(e) => setDraftActorUserId(e.target.value)}
                  dir="ltr"
                />
              </UiField>
              <UiField>
                <FieldLabel htmlFor="filter-from">من</FieldLabel>
                <Input
                  id="filter-from"
                  type="datetime-local"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                />
              </UiField>
              <UiField>
                <FieldLabel htmlFor="filter-to">إلى</FieldLabel>
                <Input
                  id="filter-to"
                  type="datetime-local"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                />
              </UiField>
              <div className="md:col-span-2 lg:col-span-4 flex items-center justify-end gap-2">
                {isFilterActive(filters) ? (
                  <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                    <FilterXIcon className="size-4" />
                    إلغاء المرشحات
                  </Button>
                ) : null}
                <Button type="submit" size="sm" loading={isFetching}>
                  تطبيق
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
          تعذّر تحميل سجل التدقيق.
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          لا توجد عمليات مطابقة.
        </div>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          pagination={
            tenantId
              ? undefined
              : { pageIndex: filters.page, pageSize: filters.size, pageCount }
          }
          onPageChange={
            tenantId
              ? undefined
              : (pageIndex) => setFilters((f) => ({ ...f, page: pageIndex }))
          }
        />
      )}
    </div>
  )
}
