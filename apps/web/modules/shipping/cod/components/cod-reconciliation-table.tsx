"use client"

import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import DataTable from "@/components/system/table"
import TableActions from "@/components/system/table-actions"
import { Badge } from "@workspace/ui/components/badge"

import type { CodReconciliationBatch, CodSettlementStatus } from "../types"
import {
  listCodReconciliationBatches,
  updateCodReconciliationStatus,
} from "../actions"
import { codReconciliationQueryKeys } from "../queryKeys"
import {
  COD_SETTLEMENT_STATUS_META,
  COD_SETTLEMENT_STATUS_TRANSITIONS,
} from "../model"

export default function CodReconciliationTable() {
  const queryClient = useQueryClient()

  const pageSize = 20
  const [pageIndex, setPageIndex] = useState(0)

  const params = useMemo(
    () => ({ page: pageIndex, size: pageSize }),
    [pageIndex]
  )

  const { data, isPending } = useQuery({
    queryKey: codReconciliationQueryKeys.list(params),
    queryFn: () => listCodReconciliationBatches(params),
  })

  const batches = data?.items ?? []
  const pageCount = Math.max(1, data?.totalPages ?? 1)

  useEffect(() => {
    setPageIndex((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  const { mutate: updateStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: updateCodReconciliationStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: codReconciliationQueryKeys.all })
    },
  })

  const columns: ColumnDef<CodReconciliationBatch>[] = [
    {
      accessorKey: "providerName",
      header: "المزود",
      cell: ({ row }) => {
        const batch = row.original
        return (
          <div className="flex flex-col gap-0.5">
            <span>{batch.providerName ?? "-"}</span>
            <span className="text-xs text-muted-foreground">{batch.providerCode ?? ""}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "settlementDate",
      header: "تاريخ التسوية",
      cell: ({ row }) => <span dir="ltr">{row.original.settlementDate ?? "-"}</span>,
    },
    {
      accessorKey: "orderCount",
      header: "عدد الطلبات",
      cell: ({ row }) => <span dir="ltr">{row.original.orderCount ?? 0}</span>,
    },
    {
      accessorKey: "collectedTotalSyp",
      header: "المحصل",
      cell: ({ row }) => <span dir="ltr">{row.original.collectedTotalSyp ?? 0}</span>,
    },
    {
      accessorKey: "netSettlementSyp",
      header: "صافي التسوية",
      cell: ({ row }) => <span dir="ltr">{row.original.netSettlementSyp ?? 0}</span>,
    },
    {
      accessorKey: "settlementStatus",
      header: "الحالة",
      cell: ({ row }) => {
        const status = row.original.settlementStatus
        if (!status) return "-"
        const meta = COD_SETTLEMENT_STATUS_META[status]
        return <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
      },
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <div />,
      cell: ({ row }) => {
        const id = row.original.id
        const status = row.original.settlementStatus
        const transitions = status ? COD_SETTLEMENT_STATUS_TRANSITIONS[status] : []

        const firstTransition = transitions[0]

        return (
          <TableActions
            onUpdate={undefined}
            onDelete={undefined}
          >
            {id && status && firstTransition ? (
              <button
                type="button"
                className="text-xs text-secondary hover:underline disabled:opacity-60"
                disabled={isUpdatingStatus}
                onClick={() =>
                  updateStatus({ id, data: { status: firstTransition as CodSettlementStatus } })
                }
              >
                تحويل إلى: {COD_SETTLEMENT_STATUS_META[firstTransition].label}
              </button>
            ) : null}
          </TableActions>
        )
      },
    },
  ]

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <DataTable
        columns={columns}
        isLoading={isPending}
        data={batches}
        pagination={{ pageIndex, pageSize, pageCount }}
        onPageChange={setPageIndex}
      />
    </div>
  )
}
