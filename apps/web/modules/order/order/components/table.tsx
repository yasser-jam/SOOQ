"use client"

import { useState, useEffect, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  type OrderStatus,
} from "@/lib/domain-enums"
import { formatSyp } from "@/lib/money"
import DataTable from "@/components/system/table"
import TableActions from "@/components/system/table-actions"
import { listAdminOrders } from "@/modules/order/order/actions"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import type { AdminOrderListItem } from "@/modules/order/order/types"
import {
  formatOrderDate,
  getOrderCustomerName,
} from "@/modules/order/order/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"

interface OrdersListTableProps {
  status?: OrderStatus
  searchQuery?: string
}

export default function OrdersListTable({
  status,
  searchQuery = "",
}: OrdersListTableProps) {
  const router = useRouter()
  const pageSize = 10
  const [pageIndex, setPageIndex] = useState(0)

  useEffect(() => {
    setPageIndex(0)
  }, [status, searchQuery])

  const { data, isPending } = useQuery({
    queryKey: orderQueryKeys.list({
      page: pageIndex,
      size: pageSize,
      sort: "placedAt,desc",
      status,
    }),
    queryFn: () =>
      listAdminOrders({
        page: pageIndex,
        size: pageSize,
        sort: "placedAt,desc",
        status,
      }),
  })

  const filteredOrders = useMemo(() => {
    // Backend wraps the list in Spring Page (`content`); the legacy custom
    // shape used `items`. Read both so the UI works regardless of which the
    // controller emits.
    const orders = data?.items ?? data?.content ?? []
    const trimmedQuery = searchQuery.trim().toLowerCase()

    if (!trimmedQuery) return orders

    return orders.filter((order) =>
      order?.orderNumber?.toLowerCase().includes(trimmedQuery)
    )
  }, [data?.items, data?.content, searchQuery])

  const columns: ColumnDef<AdminOrderListItem>[] = [
    {
      accessorKey: "orderNumber",
      header: "رقم الطلب",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original?.orderNumber}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      enableSorting: true,
      cell: ({ row }) => {
        const statusMeta = ORDER_STATUS_META[row.original.status]

        return (
          <Badge variant={statusMeta?.badgeVariant}>{statusMeta?.label}</Badge>
        )
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "حالة الدفع",
      enableSorting: false,
      cell: ({ row }) => {
        const paymentStatus = row.original.paymentStatus

        if (!paymentStatus) {
          return <span className="text-muted-foreground">—</span>
        }

        const meta = PAYMENT_STATUS_META[paymentStatus]

        return <Badge variant={meta?.badgeVariant}>{meta?.label}</Badge>
      },
    },
    {
      accessorKey: "itemCount",
      header: "العناصر",
      enableSorting: false,
      cell: ({ row }) => {
        const count = row.original.itemCount

        if (typeof count !== "number") {
          return <span className="text-muted-foreground">—</span>
        }

        return <span>{count} عناصر</span>
      },
    },
    {
      accessorKey: "total",
      header: "الإجمالي",
      enableSorting: true,
      cell: ({ row }) => {
        const total = row.original.total

        return (
          <span className="font-medium">
            {typeof total === "number" ? formatSyp(total) : "—"}
          </span>
        )
      },
    },
    {
      accessorKey: "placedAt",
      header: "التاريخ",
      enableSorting: true,
      cell: ({ row }) => (
        <span>
          {formatOrderDate(row.original.placedAt ?? row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "client",
      header: "العميل",
      enableSorting: false,
      cell: ({ row }) => {
        const clientName = getOrderCustomerName(row.original)
        const avatarUrl = row.original.customerName

        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={avatarUrl ?? undefined} alt={clientName} />
              <AvatarFallback>{clientName.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span>{clientName}</span>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div></div>,
      enableSorting: false,
      cell: ({ row }) => {
        const orderId = row.original.id

        return (
          <TableActions
            onUpdate={() => {
              router.push(`/orders/${orderId}`)
            }}
            onDelete={() => undefined}
          />
        )
      },
    },
  ]

  const pageCount = Math.max(1, data?.totalPages ?? 1)

  return (
    <div className="w-full overflow-hidden rounded-lg border bg-white">
      <DataTable
        columns={columns}
        isLoading={isPending}
        data={filteredOrders}
        pagination={{ pageIndex, pageSize, pageCount }}
        onPageChange={setPageIndex}
      />
    </div>
  )
}
