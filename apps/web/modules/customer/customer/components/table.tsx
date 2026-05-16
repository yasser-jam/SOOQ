"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { ChevronLeft } from "lucide-react"

import DataTable from "@/components/system/table"
import { useStorePath } from "@/lib/store-path"
import { listAdminCustomers } from "@/modules/customer/customer/actions"
import { customerQueryKeys } from "@/modules/customer/customer/queryKeys"
import type {
  AdminCustomerSearchRequest,
  AdminCustomerSummary,
  CustomerSortField,
  SortDirection,
} from "@/modules/customer/customer/types"
import {
  formatDateArabic,
  formatRelativeArabic,
  formatSpendSyp,
} from "@/modules/customer/customer/utils"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type SortableHeaderProps = {
  field: CustomerSortField
  label: string
  currentField: CustomerSortField | null
  currentDirection: SortDirection | null
  onChange: (field: CustomerSortField, direction: SortDirection) => void
}

function SortableHeader({
  field,
  label,
  currentField,
  currentDirection,
  onChange,
}: SortableHeaderProps) {
  const isActive = currentField === field
  const Icon = !isActive
    ? ArrowUpDown
    : currentDirection === "asc"
      ? ArrowUp
      : ArrowDown

  const handleClick = () => {
    if (!isActive) {
      onChange(field, "desc")
      return
    }
    onChange(field, currentDirection === "asc" ? "desc" : "asc")
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="h-auto gap-2 px-0 hover:bg-transparent"
    >
      <span>{label}</span>
      <Icon
        className={cn(
          "size-3.5",
          isActive ? "text-foreground" : "text-muted-foreground/60"
        )}
      />
    </Button>
  )
}

interface CustomersTableProps {
  params: AdminCustomerSearchRequest
  onPageChange: (pageIndex: number) => void
  onSortChange: (sort: string) => void
}

export default function CustomersTable({
  params,
  onPageChange,
  onSortChange,
}: CustomersTableProps) {
  const router = useRouter()
  const storePath = useStorePath()

  const { data, isPending } = useQuery({
    queryKey: customerQueryKeys.list(params as Record<string, unknown>),
    queryFn: () => listAdminCustomers(params),
  })

  const { currentSortField, currentSortDirection } = useMemo(() => {
    if (!params.sort) return { currentSortField: null, currentSortDirection: null }
    const [field, dir] = params.sort.split(",")
    return {
      currentSortField: (field as CustomerSortField) ?? null,
      currentSortDirection:
        dir === "asc" || dir === "desc" ? (dir as SortDirection) : null,
    }
  }, [params.sort])

  const handleSortChange = (
    field: CustomerSortField,
    direction: SortDirection
  ) => {
    onSortChange(`${field},${direction}`)
  }

  const columns: ColumnDef<AdminCustomerSummary>[] = [
    {
      accessorKey: "fullName",
      header: () => (
        <SortableHeader
          field="fullName"
          label="الاسم"
          currentField={currentSortField}
          currentDirection={currentSortDirection}
          onChange={handleSortChange}
        />
      ),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.fullName || "—"}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "الهاتف",
      cell: ({ row }) => (
        <span className="font-mono text-sm" dir="ltr">
          {row.original.phone || "—"}
        </span>
      ),
    },
    {
      accessorKey: "orderCount",
      header: () => (
        <SortableHeader
          field="orderCount"
          label="الطلبات"
          currentField={currentSortField}
          currentDirection={currentSortDirection}
          onChange={handleSortChange}
        />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.orderCount ?? 0}</span>
      ),
    },
    {
      accessorKey: "totalSpendSyp",
      header: () => (
        <SortableHeader
          field="totalSpendSyp"
          label="الإنفاق"
          currentField={currentSortField}
          currentDirection={currentSortDirection}
          onChange={handleSortChange}
        />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatSpendSyp(row.original.totalSpendSyp)} ل.س
        </span>
      ),
    },
    {
      accessorKey: "lastOrderAt",
      header: () => (
        <SortableHeader
          field="lastOrderAt"
          label="آخر طلب"
          currentField={currentSortField}
          currentDirection={currentSortDirection}
          onChange={handleSortChange}
        />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm">{formatDateArabic(row.original.lastOrderAt)}</span>
          {row.original.lastOrderAt ? (
            <span className="text-xs text-muted-foreground">
              {formatRelativeArabic(row.original.lastOrderAt)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <SortableHeader
          field="createdAt"
          label="تاريخ التسجيل"
          currentField={currentSortField}
          currentDirection={currentSortDirection}
          onChange={handleSortChange}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateArabic(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <div />,
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(storePath(`/customers/${row.original.customerId}`))
            }
            aria-label="عرض تفاصيل العميل"
          >
            عرض التفاصيل
            <ChevronLeft data-icon="inline-end" />
          </Button>
        </div>
      ),
    },
  ]

  const customers = data?.data ?? []
  const pageSize = data?.meta?.size ?? params.size ?? 20
  const pageIndex = data?.meta?.page ?? params.page ?? 0
  const pageCount = Math.max(1, data?.meta?.totalPages ?? 1)

  return (
    <div className="w-full overflow-hidden rounded-lg border bg-white">
      <DataTable
        columns={columns}
        isLoading={isPending}
        data={customers}
        pagination={{ pageIndex, pageSize, pageCount }}
        onPageChange={onPageChange}
        emptyState={
          <div className="py-8 text-center text-muted-foreground">
            لا يوجد عملاء يطابقون الفلاتر الحالية
          </div>
        }
      />
    </div>
  )
}
