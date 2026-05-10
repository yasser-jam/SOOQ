"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import DataTable from "@/components/system/table"
import { formatSyp } from "@/lib/money"
import { useStorePath } from "@/lib/store-path"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { getShipment } from "@/modules/shipping/shipment/actions"
import { shipmentQueryKeys } from "@/modules/shipping/shipment/queryKeys"
import { formatShipmentDateTime } from "@/modules/shipping/shipment/utils"

import { listCodEntriesByShipment } from "../actions"
import { codEntriesQueryKeys } from "../queryKeys"
import type { CodCollectionEntry } from "../types"

interface CodShipmentEntriesPageViewProps {
  shipmentId: string
}

export default function CodShipmentEntriesPageView({
  shipmentId,
}: CodShipmentEntriesPageViewProps) {
  const router = useRouter()
  const storePath = useStorePath()

  const { data: shipment } = useQuery({
    queryKey: shipmentQueryKeys.detail(shipmentId),
    queryFn: () => getShipment(shipmentId),
  })

  const { data: entries, isPending } = useQuery({
    queryKey: codEntriesQueryKeys.byShipment(shipmentId),
    queryFn: () => listCodEntriesByShipment(shipmentId),
  })

  const columns: ColumnDef<CodCollectionEntry>[] = [
    {
      accessorKey: "paymentTxnId",
      header: "رقم معاملة الدفع",
      cell: ({ row }) => (
        <span dir="ltr">{row.original.paymentTxnId ?? "-"}</span>
      ),
    },
    {
      accessorKey: "expectedAmountSyp",
      header: "المبلغ المتوقع",
      cell: ({ row }) => (
        <span dir="ltr">{formatSyp(row.original.expectedAmountSyp)}</span>
      ),
    },
    {
      accessorKey: "collectedAmountSyp",
      header: "المبلغ المحصل",
      cell: ({ row }) => (
        <span dir="ltr">{formatSyp(row.original.collectedAmountSyp)}</span>
      ),
    },
    {
      accessorKey: "collectedAt",
      header: "تاريخ التحصيل",
      cell: ({ row }) => (
        <span dir="ltr">
          {formatShipmentDateTime(row.original.collectedAt)}
        </span>
      ),
    },
  ]

  const totalExpected = (entries ?? []).reduce(
    (sum, entry) => sum + (entry.expectedAmountSyp ?? 0),
    0
  )
  const totalCollected = (entries ?? []).reduce(
    (sum, entry) => sum + (entry.collectedAmountSyp ?? 0),
    0
  )

  return (
    <div className="container my-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="رجوع"
            onClick={() =>
              router.push(storePath(`/logistics/shipping/shipments/${shipmentId}`))
            }
          >
            <ArrowRight />
          </Button>
          <h1 className="page-title">حركات تحصيل COD</h1>
          {shipment?.providerName ? (
            <span className="text-sm text-muted-foreground">
              {shipment.providerName}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SummaryCard label="عدد الحركات" value={String(entries?.length ?? 0)} />
        <SummaryCard label="إجمالي المتوقع" value={formatSyp(totalExpected)} />
        <SummaryCard label="إجمالي المحصل" value={formatSyp(totalCollected)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">السجل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-hidden rounded-lg border">
            <DataTable
              columns={columns}
              isLoading={isPending}
              data={entries ?? []}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-6">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold" dir="ltr">
          {value}
        </span>
      </CardContent>
    </Card>
  )
}
