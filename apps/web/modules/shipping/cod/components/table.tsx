"use client"

import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { FileBox } from "lucide-react"
import { toast } from "sonner"

import EmptyState from "@/components/system/empty-state"
import DataTable from "@/components/system/table"
import TableActions from "@/components/system/table-actions"
import { SETTLEMENT_STATUS_META } from "@/lib/domain-enums"
import { formatSyp } from "@/lib/money"
import { useStorePath } from "@/lib/store-path"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import {
  listCodReconciliationBatches,
  updateCodReconciliationStatus,
} from "../actions"
import { initCodReconciliationStatusUpdate } from "../init"
import { COD_SETTLEMENT_STATUS_TRANSITIONS } from "../model"
import { codReconciliationQueryKeys } from "../queryKeys"
import type {
  CodReconciliationBatch,
  CodReconciliationFilters,
} from "../types"

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

  const fetchParams = useMemo(() => ({ page: 0, size: FETCH_SIZE }), [])

  const { data, isPending } = useQuery({
    queryKey: codReconciliationQueryKeys.list(fetchParams),
    queryFn: () => listCodReconciliationBatches(fetchParams),
  })

  const filteredBatches = useMemo(() => {
    const batches = data?.content ?? []

    if (!filters) return batches

    const { shippingProviderId, settlementDateFrom, settlementDateTo } = filters

    return batches.filter((batch) => {
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
  }, [data, filters])

  const pageCount = Math.max(1, Math.ceil(filteredBatches.length / PAGE_SIZE))

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
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: codReconciliationQueryKeys.all,
      })
      toast.success(
        `تم التحويل إلى: ${SETTLEMENT_STATUS_META[variables.data.status].label}`
      )
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

        const meta = SETTLEMENT_STATUS_META[status]

        return <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
      },
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <div></div>,
      cell: ({ row }) => {
        const batchId = row.original.id
        const status = row.original.settlementStatus
        const nextStatus = status
          ? COD_SETTLEMENT_STATUS_TRANSITIONS[status][0]
          : undefined

        return (
          <TableActions
            onUpdate={() => {
              if (!batchId) return
              router.push(
                storePath(`/finance/shipping/cod-reconciliation/${batchId}`)
              )
            }}
          >
            {batchId && nextStatus ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() =>
                  updateStatus(
                    initCodReconciliationStatusUpdate(batchId, nextStatus)
                  )
                }
              >
                تحويل إلى: {SETTLEMENT_STATUS_META[nextStatus].label}
              </Button>
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
        data={pageRows}
        pagination={{ pageIndex, pageSize: PAGE_SIZE, pageCount }}
        onPageChange={setPageIndex}
        emptyState={
          <EmptyState
            icon={<FileBox className="size-8" />}
            title="لا توجد تسويات مطابقة"
            description="جرّب تغيير إعدادات الفلترة أو أنشئ دفعة تسوية جديدة."
            cta={{
              label: "إنشاء دفعة تسوية",
              onClick: () =>
                router.push(
                  storePath("/finance/shipping/cod-reconciliation/create")
                ),
            }}
          />
        }
      />
    </div>
  )
}
