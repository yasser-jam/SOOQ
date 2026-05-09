"use client"

import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import DataTable from "@/components/system/table"
import TableActions from "@/components/system/table-actions"
import { Badge } from "@workspace/ui/components/badge"

import type { Shipment, ShipmentFilters } from "../types"
import { listShipments } from "../actions"
import { shipmentQueryKeys } from "../queryKeys"
import { SHIPMENT_STATUS_META } from "../model"
import { formatShipmentDateTime } from "../utils"

interface ShipmentsTableProps {
  filters?: ShipmentFilters
}

// createdAt arrives as full ISO; filters use yyyy-MM-dd. Compare on calendar
// day; from is inclusive, to is inclusive (covers the entire day).
const matchesDateRange = (
  createdAt: string | undefined,
  from: string | undefined,
  to: string | undefined
): boolean => {
  if (!from && !to) return true
  if (!createdAt) return false
  const day = createdAt.slice(0, 10)
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}

export default function ShipmentsTable({ filters }: ShipmentsTableProps) {
  const router = useRouter()

  const { data: shipments, isPending } = useQuery({
    queryKey: shipmentQueryKeys.list(),
    queryFn: listShipments,
  })

  const filteredShipments = useMemo(() => {
    const rows = shipments ?? []
    if (!filters) return rows
    return rows.filter((shipment) => {
      if (filters.status && shipment.shipmentStatus !== filters.status)
        return false
      if (
        filters.shippingProviderId &&
        shipment.shippingProviderId !== filters.shippingProviderId
      )
        return false
      if (
        !matchesDateRange(
          shipment.createdAt,
          filters.createdAtFrom,
          filters.createdAtTo
        )
      )
        return false
      return true
    })
  }, [shipments, filters])

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
  const totalCount = filteredShipments.length
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

  useEffect(() => {
    setPageIndex((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  // Reset to first page whenever filters change so the user always sees the
  // start of the filtered list. (Same pattern as cod-reconciliation-table —
  // a known react-hooks/set-state-in-effect warning we accept consistently.)
  useEffect(() => {
    setPageIndex(0)
  }, [filters])

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <DataTable
        columns={columns}
        isLoading={isPending}
        data={filteredShipments}
        pagination={{ pageIndex, pageSize, pageCount }}
        onPageChange={setPageIndex}
      />
    </div>
  )
}
