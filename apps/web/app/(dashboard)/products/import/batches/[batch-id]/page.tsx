"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, CheckCircle2 } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { getImportBatch } from "@/modules/product/import/actions"
import { importQueryKeys } from "@/modules/product/import/queryKeys"

const statusColor = (status?: string) => {
  switch (status) {
    case "COMPLETED":
      return "default"
    case "PARTIAL":
      return "secondary"
    case "FAILED":
      return "destructive"
    case "DRY_RUN":
      return "outline"
    default:
      return "secondary"
  }
}

export default function ImportBatchDetailPage() {
  const params = useParams()
  const batchId = params?.["batch-id"]?.toString() ?? ""

  const { data: batch, isPending } = useQuery({
    queryKey: importQueryKeys.batch(batchId),
    queryFn: () => getImportBatch(batchId),
    enabled: Boolean(batchId),
  })

  if (isPending) {
    return (
      <div className="container my-6 flex flex-col gap-3">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="container my-6">
        <p className="text-sm text-muted-foreground">دفعة غير موجودة.</p>
      </div>
    )
  }

  return (
    <div className="container my-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="page-title">تفاصيل الاستيراد</div>
          <p className="text-xs text-muted-foreground font-mono" dir="ltr">
            {batch.batchId}
          </p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Badge variant={statusColor(batch.status) as any}>{batch.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الملخّص</CardTitle>
          <CardDescription>
            {batch.fileName ? (
              <>الملف: <span dir="ltr">{batch.fileName}</span></>
            ) : null}
            {batch.uploadedAt ? (
              <span className="ms-2">
                • {new Date(batch.uploadedAt).toLocaleString("ar")}
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">إجمالي الصفوف</p>
              <p className="text-2xl font-medium">
                {batch.totalRows ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">نجاح</p>
              <p className="text-2xl font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="size-5" />
                {batch.successRows ?? 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">فشل</p>
              <p className="text-2xl font-medium text-destructive flex items-center gap-1">
                <AlertCircle className="size-5" />
                {batch.errorRows ?? 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الوضع</p>
              <p className="text-sm font-medium mt-2">
                {batch.dryRun ? "تجريبي (لم يُحفظ)" : "حقيقي"}
              </p>
            </div>
          </div>

          {batch.detectedColumns?.length ? (
            <div className="mt-4 rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-2">
                الأعمدة المُكتشفة في الملف:
              </p>
              <div className="flex flex-wrap gap-1">
                {batch.detectedColumns.map((c) => (
                  <Badge key={c} variant="outline" className="font-mono text-xs">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {batch.errors && batch.errors.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>الأخطاء ({batch.errors.length})</CardTitle>
            <CardDescription>
              صفّ × عمود × رسالة. صحّح هذه السطور وأعد الرفع.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">الصفّ</TableHead>
                    <TableHead className="w-40">العمود</TableHead>
                    <TableHead>الرسالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.errors.map((err, i) => (
                    <TableRow key={`${err.rowNumber}-${i}`}>
                      <TableCell>{err.rowNumber}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {err.field ?? "—"}
                      </TableCell>
                      <TableCell className="text-destructive">
                        {err.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
