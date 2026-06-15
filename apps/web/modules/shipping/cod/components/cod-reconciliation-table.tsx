"use client"

import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { FileBox } from "lucide-react"

import DataTable from "@/components/system/table"
import TableActions from "@/components/system/table-actions"
import { formatSyp } from "@/lib/money"
import { useStorePath } from "@/lib/store-path"
import { Badge } from "@workspace/ui/components/badge"

import type {
  CodReconciliationBatch,
  CodReconciliationFilters,
  CodSettlementStatus,
} from "../types"
import {
  listCodReconciliationBatches,
  updateCodReconciliationStatus,
} from "../actions"
import { codReconciliationQueryKeys } from "../queryKeys"
import {
  COD_SETTLEMENT_STATUS_META,
  COD_SETTLEMENT_STATUS_TRANSITIONS,
} from "../model"

interface CodReconciliationTableProps {
  filters?: CodReconciliationFilters
}

// Fetch a generous page so client-side filtering covers typical-scale data.
// Server-side filtering is the long-term answer; this is the documented
// interim per Phase 11.2 in plan.md.
const FETCH_SIZE = 200
const PAGE_SIZE = 20

export default function CodReconciliationTable({
  filters,
}: CodReconciliationTableProps) {
  const router = useRouter()
  const storePath = useStorePath()
  const queryClient = useQueryClient()

  const [pageIndex, setPageIndex] = useState(0)

  const fetchParams = useMemo(
    () => ({ page: 0, size: FETCH_SIZE }),
    []
  )

  const { data, isPending } = useQuery({
    queryKey: codReconciliationQueryKeys.list(fetchParams),
    queryFn: () => listCodReconciliationBatches(fetchParams),
  })

  const allBatches = data?.content ?? data?.items ?? []

  const filteredBatches = useMemo(() => {
    if (!filters) return allBatches

    const { shippingProviderId, settlementDateFrom, settlementDateTo } = filters

    return allBatches.filter((batch) => {
      if (
        shippingProviderId &&
        batch.shippingProviderId !== shippingProviderId
      ) {
        return false
      }
      // Settlement dates from the API are ISO YYYY-MM-DD strings — string
      // comparison is enough for inclusive bounds.
      if (
        settlementDateFrom &&
        batch.settlementDate &&
        batch.settlementDate < settlementDateFrom
      ) {
        return false
      }
      if (
        settlementDateTo &&
        batch.settlementDate &&
        batch.settlementDate > settlementDateTo
      ) {
        return false
      }
      return true
    })
  }, [allBatches, filters])

  const totalElements = filteredBatches.length
  const pageCount = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))

  // Reset to first page whenever filters change or the row count shrinks
  // below the current page.
  useEffect(() => {
    setPageIndex(0)
  }, [
    filters?.shippingProviderId,
    filters?.settlementDateFrom,
    filters?.settlementDateTo,
  ])

  useEffect(() => {
    setPageIndex((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  const pageRows = useMemo(
    () =>
      filteredBatches.slice(
        pageIndex * PAGE_SIZE,
        pageIndex * PAGE_SIZE + PAGE_SIZE
      ),
    [filteredBatches, pageIndex]
  )

  const { mutate: updateStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: updateCodReconciliationStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: codReconciliationQueryKeys.all,
      })
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
            <span className="text-xs text-muted-foreground">
              {batch.providerCode ?? ""}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "settlementDate",
      header: "تاريخ التسوية",
      cell: ({ row }) => (
        <span dir="ltr">{row.original.settlementDate ?? "-"}</span>
      ),
    },
    {
      accessorKey: "orderCount",
      header: "عدد الطلبات",
      cell: ({ row }) => <span dir="ltr">{row.original.orderCount ?? 0}</span>,
    },
    {
      accessorKey: "expectedTotalSyp",
      header: "المتوقع",
      cell: ({ row }) => (
        <span dir="ltr">{formatSyp(row.original.expectedTotalSyp)}</span>
      ),
    },
    {
      accessorKey: "collectedTotalSyp",
      header: "المحصل",
      cell: ({ row }) => (
        <span dir="ltr">{formatSyp(row.original.collectedTotalSyp)}</span>
      ),
    },
    {
      accessorKey: "providerFeeAmountSyp",
      header: "عمولة المزود",
      cell: ({ row }) => (
        <span dir="ltr">{formatSyp(row.original.providerFeeAmountSyp)}</span>
      ),
    },
    {
      accessorKey: "netSettlementSyp",
      header: "صافي التسوية",
      cell: ({ row }) => (
        <span dir="ltr">{formatSyp(row.original.netSettlementSyp)}</span>
      ),
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
        const transitions = status
          ? COD_SETTLEMENT_STATUS_TRANSITIONS[status]
          : []

        const firstTransition = transitions[0]

        return (
          <TableActions
            onUpdate={() => {
              if (!id) return
              router.push(storePath(`/finance/shipping/cod-reconciliation/${id}`))
            }}
            onDelete={undefined}
          >
            {id && status && firstTransition ? (
              <button
                type="button"
                className="text-xs text-secondary hover:underline disabled:opacity-60"
                disabled={isUpdatingStatus}
                onClick={() =>
                  updateStatus({
                    id,
                    data: { status: firstTransition as CodSettlementStatus },
                  })
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

  // Empty State
  if (!isPending && filteredBatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16 shadow-sm">
        <div
          className="mb-4 rounded-full p-4"
          style={{ backgroundColor: "#F3F4F6" }}
        >
          <FileBox className="size-12" style={{ color: "#9CA3AF" }} />
        </div>
        <h3 className="mb-2 text-lg font-semibold" style={{ color: "#122640" }}>
          لا توجد تسويات مطابقة
        </h3>
        <p className="text-sm text-gray-500">
          جرب تغيير إعدادات الفلترة أو قم بإنشاء دفعة تسوية جديدة
        </p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-white shadow-sm">
      <DataTable
        columns={columns}
        isLoading={isPending}
        data={pageRows}
        pagination={{ pageIndex, pageSize: PAGE_SIZE, pageCount }}
        onPageChange={setPageIndex}
      />
    </div>
  )
}
