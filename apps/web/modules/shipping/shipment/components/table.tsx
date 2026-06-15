"use client"

import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Package, Search } from "lucide-react"

import DataTable from "@/components/system/table"
import TableActions from "@/components/system/table-actions"
import { useStorePath } from "@/lib/store-path"
import { Badge } from "@workspace/ui/components/badge"

import type { Shipment, ShipmentFilters } from "../types"
import { listShipments } from "../actions"
import { shipmentQueryKeys } from "../queryKeys"
import { SHIPMENT_STATUS_META } from "../model"
import { formatShipmentDateTime } from "../utils"

interface ShipmentsTableProps {
  filters?: ShipmentFilters
  searchQuery?: string
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

const matchesSearchQuery = (
  shipment: Shipment,
  query: string
): boolean => {
  if (!query) return true
  const lowerQuery = query.toLowerCase()
  return (
    (shipment.orderId?.toLowerCase().includes(lowerQuery) ?? false) ||
    (shipment.providerName?.toLowerCase().includes(lowerQuery) ?? false) ||
    (shipment.providerCode?.toLowerCase().includes(lowerQuery) ?? false) ||
    (shipment.shipmentId?.toLowerCase().includes(lowerQuery) ?? false)
  )
}

export default function ShipmentsTable({ filters, searchQuery = "" }: ShipmentsTableProps) {
  const router = useRouter()
  const storePath = useStorePath()

  const { data: shipments, isPending } = useQuery({
    queryKey: shipmentQueryKeys.list(),
    queryFn: listShipments,
  })

  const filteredShipments = useMemo(() => {
    const rows = shipments ?? []
    return rows.filter((shipment) => {
      if (filters?.status && shipment.shipmentStatus !== filters.status)
        return false
      if (
        filters?.shippingProviderId &&
        shipment.shippingProviderId !== filters.shippingProviderId
      )
        return false
      if (
        !matchesDateRange(
          shipment.createdAt,
          filters?.createdAtFrom,
          filters?.createdAtTo
        )
      )
        return false
      if (!matchesSearchQuery(shipment, searchQuery))
        return false
      return true
    })
  }, [shipments, filters, searchQuery])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return { bg: "#E8F7ED", text: "#50CE76" }
      case "PENDING":
      case "PICKED_UP":
      case "IN_TRANSIT":
      case "READY_FOR_PICKUP_AT_OFFICE":
        return { bg: "#FFF4E5", text: "#E49F9F" }
      case "FAILED":
      case "RETURNED":
        return { bg: "#FEE2E2", text: "#B73333" }
      default:
        return { bg: "#F3F4F6", text: "#6B7280" }
    }
  }

  const columns: ColumnDef<Shipment>[] = [
    {
      accessorKey: "orderId",
      header: "رقم الطلب",
      cell: ({ row }) => (
        <span className="font-medium" style={{ color: "#374151" }} dir="ltr">
          {row.original.orderId ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "providerName",
      header: "مزود الشحن",
      cell: ({ row }) => {
        const shipment = row.original
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium" style={{ color: "#374151" }}>
              {shipment.providerName ?? "-"}
            </span>
            <span className="text-xs" style={{ color: "#6B7280" }}>
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
        const colors = getStatusColor(status)
        return (
          <Badge
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
              border: "none",
            }}
            className="font-medium"
          >
            {meta.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "تاريخ الإنشاء",
      cell: ({ row }) => (
        <span className="text-sm" style={{ color: "#6B7280" }} dir="ltr">
          {formatShipmentDateTime(row.original.createdAt)}
        </span>
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
              router.push(storePath(`/logistics/shipping/shipments/${id}`))
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
  }, [filters, searchQuery])

  // Empty State
  if (!isPending && filteredShipments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div
          className="mb-4 rounded-full p-4"
          style={{ backgroundColor: "#F3F4F6" }}
        >
          <Package className="size-12" style={{ color: "#9CA3AF" }} />
        </div>
        <h3 className="mb-2 text-lg font-semibold" style={{ color: "#122640" }}>
          لا توجد شحنات حالياً
        </h3>
        <p className="mb-6 text-sm" style={{ color: "#6B7280" }}>
          لم يتم العثور على شحنات تطابق معايير البحث
        </p>
        <button
          onClick={() => {
            // TODO: Navigate to create shipment page
          }}
          className="rounded-lg px-6 py-2.5 font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "#BA7B1B" }}
        >
          إنشاء شحنة جديدة
        </button>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden rounded-lg">
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
