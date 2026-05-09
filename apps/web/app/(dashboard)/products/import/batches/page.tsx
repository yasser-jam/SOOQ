"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"

import DataTable from "@/components/system/table"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import { listImportBatches } from "@/modules/product/import/actions"
import { importQueryKeys } from "@/modules/product/import/queryKeys"
import type {
  ImportBatchStatus,
  ImportBatchSummary,
} from "@/modules/product/import/types"

const statusBadge = (s: ImportBatchStatus) => {
  switch (s) {
    case "COMPLETED":
      return <Badge>{s}</Badge>
    case "PARTIAL":
      return <Badge variant="secondary">{s}</Badge>
    case "FAILED":
      return <Badge variant="destructive">{s}</Badge>
    case "DRY_RUN":
      return <Badge variant="outline">{s}</Badge>
    default:
      return <Badge variant="secondary">{s}</Badge>
  }
}

export default function ImportBatchesPage() {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const pageSize = 20

  const { data: batches, isPending } = useQuery({
    queryKey: importQueryKeys.list(page),
    queryFn: () => listImportBatches({ page, size: pageSize }),
  })

  const columns: ColumnDef<ImportBatchSummary>[] = useMemo(
    () => [
      {
        accessorKey: "batchId",
        header: "رقم الدفعة",
        cell: ({ row }) => (
          <span className="font-mono text-xs" dir="ltr">
            {row.original.batchId.slice(0, 8)}…
          </span>
        ),
      },
      {
        accessorKey: "fileName",
        header: "اسم الملف",
        cell: ({ row }) => row.original.fileName ?? "—",
      },
      {
        accessorKey: "status",
        header: "الحالة",
        cell: ({ row }) => statusBadge(row.original.status),
      },
      {
        id: "rows",
        header: "الصفوف",
        cell: ({ row }) =>
          row.original.totalRows != null ? (
            <span>
              <span className="text-emerald-600 font-medium">
                {row.original.successRows ?? 0}
              </span>
              {" / "}
              <span>{row.original.totalRows}</span>
              {row.original.errorRows ? (
                <span className="text-destructive ms-1">
                  ({row.original.errorRows} أخطاء)
                </span>
              ) : null}
            </span>
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "uploadedAt",
        header: "تاريخ الرفع",
        cell: ({ row }) =>
          row.original.uploadedAt
            ? new Date(row.original.uploadedAt).toLocaleString("ar")
            : "—",
      },
      {
        id: "actions",
        header: () => <div></div>,
        cell: ({ row }) => (
          <Button asChild size="sm" variant="ghost">
            <Link href={`/products/import/batches/${row.original.batchId}`}>
              تفاصيل
            </Link>
          </Button>
        ),
      },
    ],
    []
  )

  const totalCount = batches?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1))
  }, [pageCount])

  return (
    <div className="container">
      <div className="my-6 flex justify-between">
        <div className="flex flex-col gap-1">
          <div className="page-title">سجلّ عمليات الاستيراد</div>
          <p className="text-sm text-muted-foreground">
            كل عمليات الرفع، حالتها، والأخطاء (إن وُجدت).
          </p>
        </div>
        <Button onClick={() => router.push("/products/import")}>
          <Plus className="size-4" />
          استيراد جديد
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <DataTable
          columns={columns}
          isLoading={isPending}
          data={batches ?? []}
          pagination={{ pageIndex: page, pageSize, pageCount }}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
