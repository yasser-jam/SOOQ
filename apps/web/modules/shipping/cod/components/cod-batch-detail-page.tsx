"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, ExternalLink } from "lucide-react"

import ConfirmAlert from "@/components/system/confirm-alert"
import DataTable from "@/components/system/table"
import { formatSyp } from "@/lib/money"
import { useStorePath } from "@/lib/store-path"
import { listShipments } from "@/modules/shipping/shipment/actions"
import { shipmentQueryKeys } from "@/modules/shipping/shipment/queryKeys"
import type { Shipment } from "@/modules/shipping/shipment/types"
import { formatShipmentDateTime } from "@/modules/shipping/shipment/utils"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import {
  getCodReconciliationBatch,
  updateCodReconciliationStatus,
} from "../actions"
import {
  COD_SETTLEMENT_STATUS_META,
  COD_SETTLEMENT_STATUS_TRANSITIONS,
} from "../model"
import { codReconciliationQueryKeys } from "../queryKeys"
import type { CodSettlementStatus } from "../types"

// settlementDate from the backend is "yyyy-MM-dd"; shipment.deliveredAt is a
// full ISO timestamp. Compare on calendar day only.
const isSameCalendarDay = (
  isoTimestamp: string | null | undefined,
  ymd: string | null | undefined
): boolean => {
  if (!isoTimestamp || !ymd) return false
  return isoTimestamp.startsWith(ymd)
}

interface CodBatchDetailPageViewProps {
  batchId: string
}

export default function CodBatchDetailPageView({
  batchId,
}: CodBatchDetailPageViewProps) {
  const router = useRouter()
  const storePath = useStorePath()
  const queryClient = useQueryClient()
  const [pendingTransition, setPendingTransition] =
    useState<CodSettlementStatus | null>(null)

  const { data: batch, isPending } = useQuery({
    queryKey: codReconciliationQueryKeys.detail(batchId),
    queryFn: () => getCodReconciliationBatch(batchId),
  })

  const { mutate: updateStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: updateCodReconciliationStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: codReconciliationQueryKeys.all,
      })
      setPendingTransition(null)
    },
  })

  const status = batch?.settlementStatus
  const transitions = status ? COD_SETTLEMENT_STATUS_TRANSITIONS[status] : []
  const statusMeta = status ? COD_SETTLEMENT_STATUS_META[status] : null

  // Backend has no GET /reconciliation/{batchId}/shipments endpoint, so we
  // approximate: load all shipments (cache shared with the shipments list
  // page) and filter client-side by provider + DELIVERED + delivery day
  // matching settlementDate. Heuristic — if 3PL collects COD with a delay,
  // some shipments may be missed; documented as a backend follow-up.
  const { data: allShipments = [], isPending: isShipmentsLoading } = useQuery({
    queryKey: shipmentQueryKeys.list(),
    queryFn: listShipments,
    enabled: Boolean(batch),
  })

  const batchShipments = useMemo<Shipment[]>(() => {
    if (!batch) return []
    return allShipments.filter(
      (shipment) =>
        shipment.shippingProviderId === batch.shippingProviderId &&
        shipment.shipmentStatus === "DELIVERED" &&
        isSameCalendarDay(shipment.deliveredAt, batch.settlementDate)
    )
  }, [allShipments, batch])

  const shipmentColumns: ColumnDef<Shipment>[] = [
    {
      accessorKey: "orderId",
      header: "الطلب",
      cell: ({ row }) => {
        const orderId = row.original.orderId
        if (!orderId) return <span>-</span>
        return (
          <Button asChild variant="link" size="sm" className="h-auto p-0">
            <Link href={storePath(`/orders/${orderId}`)} dir="ltr">
              {orderId.slice(0, 8)}
              <ExternalLink data-icon="inline-end" />
            </Link>
          </Button>
        )
      },
    },
    {
      accessorKey: "collectedCodAmountSyp",
      header: "المُحصَّل",
      cell: ({ row }) => (
        <span dir="ltr">
          {formatSyp(row.original.collectedCodAmountSyp ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: "deliveredAt",
      header: "تاريخ التسليم",
      cell: ({ row }) => (
        <span dir="ltr">
          {formatShipmentDateTime(row.original.deliveredAt ?? undefined)}
        </span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <div />,
      cell: ({ row }) => {
        const id = row.original.id
        if (!id) return null
        return (
          <Button asChild variant="outline" size="sm">
            <Link href={storePath(`/logistics/shipping/shipments/${id}/cod`)}>
              حركات COD
            </Link>
          </Button>
        )
      },
    },
  ]

  if (isPending) {
    return (
      <div className="container my-6 flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="container my-6 flex flex-col items-center gap-4">
        <p className="text-muted-foreground">
          لم يتم العثور على دفعة التسوية المطلوبة.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push(storePath("/finance/shipping/cod-reconciliation"))}
        >
          العودة إلى القائمة
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="container my-6 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="رجوع"
              onClick={() =>
                router.push(storePath("/finance/shipping/cod-reconciliation"))
              }
            >
              <ArrowRight />
            </Button>
            <h1 className="page-title">تفاصيل دفعة التسوية</h1>
            {statusMeta ? (
              <Badge variant={statusMeta.badgeVariant}>
                {statusMeta.label}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {transitions.map((target) => (
              <Button
                key={target}
                size="md"
                variant={target === "DISPUTED" ? "destructive" : "secondary"}
                disabled={isUpdatingStatus}
                onClick={() => setPendingTransition(target)}
              >
                تحويل إلى: {COD_SETTLEMENT_STATUS_META[target].label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl">المزود</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <DetailRow label="الاسم" value={batch.providerName ?? "-"} />
              <DetailRow
                label="الكود"
                value={batch.providerCode ?? "-"}
                dir="ltr"
              />
              <DetailRow
                label="تاريخ التسوية"
                value={batch.settlementDate ?? "-"}
                dir="ltr"
              />
              <DetailRow
                label="تاريخ الإنشاء"
                value={batch.reconciledAt ?? "-"}
                dir="ltr"
              />
              <DetailRow
                label="عدد الطلبات"
                value={String(batch.orderCount ?? 0)}
                dir="ltr"
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">الأرقام المالية</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <DetailRow
                label="المتوقع تحصيله"
                value={formatSyp(batch.expectedTotalSyp)}
              />
              <DetailRow
                label="المحصل فعلياً"
                value={formatSyp(batch.collectedTotalSyp)}
              />
              <DetailRow
                label="نسبة عمولة المزود"
                value={`${batch.providerFeePercentage ?? 0}%`}
                dir="ltr"
              />
              <DetailRow
                label="مبلغ عمولة المزود"
                value={formatSyp(batch.providerFeeAmountSyp)}
              />
              <DetailRow
                label="صافي التسوية"
                value={formatSyp(batch.netSettlementSyp)}
                emphasize
              />
            </CardContent>
          </Card>

          {batch.notes ? (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-xl">ملاحظات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {batch.notes}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-xl">شحنات هذه الدفعة</CardTitle>
              <p className="text-xs text-muted-foreground">
                مطابقة تقريبية: شحنات مسلَّمة بنفس مزود الشحن وبنفس تاريخ
                التسوية. قد يختلف الحصر الدقيق إذا تأخّر المزود في إرسال
                التحصيل.
              </p>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-hidden rounded-lg border">
                <DataTable
                  columns={shipmentColumns}
                  isLoading={isShipmentsLoading}
                  data={batchShipments}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmAlert
        open={pendingTransition !== null}
        onOpenChange={(open) => {
          if (!open) setPendingTransition(null)
        }}
        title={
          pendingTransition
            ? `تحويل إلى: ${COD_SETTLEMENT_STATUS_META[pendingTransition].label}`
            : ""
        }
        description="هذا الإجراء يُحدّث حالة دفعة التسوية. هل تريد المتابعة؟"
        actionLabel="تأكيد"
        variant={pendingTransition === "DISPUTED" ? "destructive" : "default"}
        onAction={() => {
          if (pendingTransition) {
            updateStatus({
              id: batchId,
              data: { status: pendingTransition },
            })
          }
        }}
      />
    </>
  )
}

function DetailRow({
  label,
  value,
  dir,
  emphasize,
}: {
  label: string
  value: string
  dir?: "ltr" | "rtl"
  emphasize?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span
        dir={dir}
        className={emphasize ? "text-base font-semibold text-secondary" : ""}
      >
        {value}
      </span>
    </div>
  )
}
