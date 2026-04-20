"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"

import DataTable from "@/components/system/table"
import TableActions from "@/components/system/table-actions"
import type { OrderListItemModel } from "@/modules/order/order/model"
import { ORDER_LIST_STATUS_META } from "@/modules/order/order/model"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"

const MOCK_ORDERS: OrderListItemModel[] = [
  {
    id: "ord-1001",
    orderNumber: "ORD-1001",
    client: { name: "محمد الأحمد", avatarUrl: "https://i.pravatar.cc/80?img=12" },
    dateLabel: "20-04-2026",
    status: "NEW",
  },
  {
    id: "ord-1002",
    orderNumber: "ORD-1002",
    client: { name: "سارة الخطيب", avatarUrl: "https://i.pravatar.cc/80?img=12" },
    dateLabel: "19-04-2026",
    status: "PROCESSING",
  },
  {
    id: "ord-1003",
    orderNumber: "ORD-1003",
    client: { name: "ليث الحمد", avatarUrl: "https://i.pravatar.cc/80?img=12" },
    dateLabel: "18-04-2026",
    status: "DELIVERED",
  },
  {
    id: "ord-1004",
    orderNumber: "ORD-1004",
    client: { name: "ملاك ياسين", avatarUrl: "https://i.pravatar.cc/80?img=12" },
    dateLabel: "17-04-2026",
    status: "RETURN_REQUESTED",
  },
  {
    id: "ord-1005",
    orderNumber: "ORD-1005",
    client: { name: "خالد ناصر", avatarUrl: "https://i.pravatar.cc/80?img=12" },
    dateLabel: "16-04-2026",
    status: "PROCESSING",
  },
]

export default function OrdersListTable() {
  const router = useRouter()

  const columns: ColumnDef<OrderListItemModel>[] = [
    {
      accessorKey: "orderNumber",
      header: "رقم الطلب",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.orderNumber}</span>
      ),
    },
    {
      accessorKey: "client",
      header: "العميل",
      enableSorting: false,
      cell: ({ row }) => {
        const client = row.original.client

        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={client.avatarUrl ?? undefined} alt={client.name} />
              <AvatarFallback>{client.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span>{client.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "dateLabel",
      header: "التاريخ",
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: "الحالة",
      enableSorting: true,
      cell: ({ row }) => {
        const status = ORDER_LIST_STATUS_META[row.original.status]

        return <Badge variant={status.badgeVariant}>{status.label}</Badge>
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

  const pageSize = 10
  const [pageIndex, setPageIndex] = React.useState(0)
  const totalCount = MOCK_ORDERS.length
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

  React.useEffect(() => {
    setPageIndex((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  const pagedOrders = React.useMemo(() => {
    const start = pageIndex * pageSize
    return MOCK_ORDERS.slice(start, start + pageSize)
  }, [pageIndex, pageSize])

  return (
    <div className="w-full overflow-hidden rounded-lg border bg-white">
      <DataTable
        columns={columns}
        data={pagedOrders}
        pagination={{ pageIndex, pageSize, pageCount }}
        onPageChange={setPageIndex}
      />
    </div>
  )
}
