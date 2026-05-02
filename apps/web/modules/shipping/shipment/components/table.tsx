"use client"

import { useEffect, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import DataTable from "@/components/system/table"
import TableActions from "@/components/system/table-actions"
import { Badge } from "@workspace/ui/components/badge"

import type { Shipment } from "../types"
import { listShipments } from "../actions"
import { shipmentQueryKeys } from "../queryKeys"
import { SHIPMENT_STATUS_META } from "../model"
import { formatShipmentDateTime } from "../utils"

export default function ShipmentsTable() {
  const router = useRouter()

  const { data: shipments, isPending } = useQuery({
    queryKey: shipmentQueryKeys.list(),
    queryFn: listShipments,
  })

  const columns: ColumnDef<Shipment>[] = [
    {
      accessorKey: "orderId",
      header: "رقم الطلب",
      cell: ({ row }) => <span dir="ltr">{row.original.orderId ?? "-"}</span>,
    },
    {
      accessorKey: "providerName",
      header: "مزود الشحن",
      cell: ({ row }) => {
        const shipment = row.original
        return (
          <div className="flex flex-col gap-0.5">
            <span>{shipment.providerName ?? "-"}</span>
            <span className="text-xs text-muted-foreground">
              {shipment.providerCode ?? ""}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "shipmentStatus",
      header: "الحالة",
      cell: ({ row }) => {
        const status = row.original.shipmentStatus
        if (!status) return "-"
        const meta = SHIPMENT_STATUS_META[status]
        return <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
      },
    },
    {
      accessorKey: "createdAt",
      header: "تاريخ الإنشاء",
      cell: ({ row }) => (
        <span dir="ltr">{formatShipmentDateTime(row.original.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <div />,
      cell: ({ row }) => {
        const id = row.original.id

        return (
          <TableActions
            onUpdate={() => {
              if (!id) return
              router.push(`/logistics/shipping/shipments/${id}`)
            }}
            onDelete={undefined}
          />
        )
      },
    },
  ]

  const pageSize = 10
  const [pageIndex, setPageIndex] = useState(0)
  const totalCount = shipments?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

  useEffect(() => {
    setPageIndex((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <DataTable
        columns={columns}
        isLoading={isPending}
        data={shipments || []}
        pagination={{ pageIndex, pageSize, pageCount }}
        onPageChange={setPageIndex}
      />
    </div>
  )
}
