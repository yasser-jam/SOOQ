"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation } from "@tanstack/react-query"
import { AlertCircle, CheckCircle2, Upload } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { useStorePath } from "@/lib/store-path"
import { previewImportFile } from "@/modules/product/import/actions"
import type { ImportPreviewResponse } from "@/modules/product/import/types"

const ACCEPTED = ".csv,.xlsx,.xls"

export default function ImportPreviewPage() {
  const storePath = useStorePath()
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportPreviewResponse | null>(null)

  const { mutate: doPreview, isPending } = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("No file")
      return previewImportFile(file)
    },
    onSuccess: (data) => setResult(data),
  })

  return (
    <div className="container my-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="page-title">معاينة ملف الاستيراد</div>
          <p className="text-sm text-muted-foreground">
            تحقّق من الأعمدة والأخطاء قبل الرفع الفعلي. لا يُنشئ دفعة في السجلّ.
          </p>
        </div>
        <Button asChild variant="ghost">
          <Link href={storePath("/products/import")}>رفع الملف فعلياً</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>اختر ملفاً</CardTitle>
          <CardDescription>CSV / XLSX</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <input
              id="preview-file"
              type="file"
              accept={ACCEPTED}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                setResult(null)
              }}
              className="hidden"
              disabled={isPending}
            />
            <Button asChild variant="secondary">
              <label htmlFor="preview-file">
                <Upload className="size-4" />
                {file ? "تغيير الملف" : "اختر ملفاً"}
              </label>
            </Button>
            {file ? (
              <Badge variant="outline">
                {file.name} • {(file.size / 1024).toFixed(1)} KB
              </Badge>
            ) : null}
            <div className="flex-1" />
            <Button
              type="button"
              onClick={() => doPreview()}
              disabled={!file || isPending}
            >
              {isPending ? "..." : "معاينة"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>الملخّص</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي الصفوف</p>
                  <p className="text-2xl font-medium">{result.totalRows}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">صحيح</p>
                  <p className="text-2xl font-medium text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="size-5" />
                    {result.totalRows - result.errors.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">به أخطاء</p>
                  <p className="text-2xl font-medium text-destructive flex items-center gap-1">
                    <AlertCircle className="size-5" />
                    {result.errors.length}
                  </p>
                </div>
              </div>

              {result.detectedColumns?.length ? (
                <div className="mt-4 rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    الأعمدة المُكتشفة:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.detectedColumns.map((c) => (
                      <Badge
                        key={c}
                        variant="outline"
                        className="font-mono text-xs"
                      >
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {result.errors.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>الأخطاء</CardTitle>
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
                      {result.errors.map((err, i) => (
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
        </>
      ) : null}
    </div>
  )
}
