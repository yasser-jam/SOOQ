"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import DataTable from "@/components/system/table"
import TableActions from "@/components/system/table-actions"
import { listAdminOrders } from "@/modules/order/order/actions"
import { ORDER_LIST_STATUS_META } from "@/modules/order/order/model"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import type { AdminOrderListItem, OrderStatus } from "@/modules/order/order/types"
import { formatOrderDate, getOrderCustomerName } from "@/modules/order/order/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"

interface OrdersListTableProps {
  status?: OrderStatus
}

export default function OrdersListTable({
  status,
}: OrdersListTableProps) {
  const router = useRouter()
  const pageSize = 10
  const [pageIndex, setPageIndex] = React.useState(0)

  React.useEffect(() => {
    setPageIndex(0)
  }, [status])

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

  const columns: ColumnDef<AdminOrderListItem>[] = [
    {
      accessorKey: "orderNumber",
      header: "رقم الطلب",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.orderNumber ?? row.original.orderId ?? row.original.id}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      enableSorting: true,
      cell: ({ row }) => {
        const statusMeta = ORDER_LIST_STATUS_META[row.original.status]

        return <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
      },
    },
    {
      accessorKey: "placedAt",
      header: "التاريخ",
      enableSorting: true,
      cell: ({ row }) => (
        <span>{formatOrderDate(row.original.placedAt ?? row.original.createdAt)}</span>
      ),
    },
    {
      accessorKey: "client",
      header: "العميل",
      enableSorting: false,
      cell: ({ row }) => {
        const clientName = getOrderCustomerName(row.original)
        const avatarUrl =
          row.original.customerAvatarUrl ?? row.original.customer?.avatarUrl

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
        const orderId =
          row.original.id ?? row.original.orderId ?? row.original.orderNumber ?? ""

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
  const orders = data?.content ?? data?.items ?? []

  return (
    <div className="w-full overflow-hidden rounded-lg border bg-white">
      <DataTable
        columns={columns}
        isLoading={isPending}
        data={orders}
        pagination={{ pageIndex, pageSize, pageCount }}
        onPageChange={setPageIndex}
      />
    </div>
  )
}
