"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useMutation } from "@tanstack/react-query"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { useStorePath } from "@/lib/store-path"
import { uploadImportFile } from "@/modules/product/import/actions"

const ACCEPTED_TYPES = ".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export default function ImportUploadPage() {
  const router = useRouter()
  const storePath = useStorePath()
  const [file, setFile] = useState<File | null>(null)
  const [dryRun, setDryRun] = useState(true)
  const [dragActive, setDragActive] = useState(false)

  const { mutate: upload, isPending } = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("No file")
      return uploadImportFile(file, dryRun)
    },
    onSuccess: (batch) => {
      toast.success(
        dryRun
          ? "تم تحليل الملف (وضع تجريبي)"
          : `تم رفع الملف. حالة الدفعة: ${batch.status}`
      )
      router.push(storePath(`/products/import/batches/${batch.batchId}`))
    },
  })

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) setFile(dropped)
  }

  return (
    <div className="container">
      <div className="my-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="page-title">استيراد منتجات (CSV / Excel)</div>
          <p className="text-sm text-muted-foreground">
            ارفع ملفاً يحتوي بيانات المنتجات. يدعم العربية وحتى آلاف الصفوف.
          </p>
        </div>
        <Button asChild variant="ghost">
          <Link href={storePath("/products/import/batches")}>سجلّ عمليات الاستيراد</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الملف</CardTitle>
          <CardDescription>
            CSV أو XLSX. الحدّ الأقصى يتبع إعدادات الخادم.
          </CardDescription>
          <CardAction>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                disabled={isPending}
                className="size-4"
              />
              تشغيل تجريبي (لا تُحفظ المنتجات)
            </label>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={
              "rounded-lg border-2 border-dashed p-10 text-center transition " +
              (dragActive ? "border-primary bg-primary/5" : "border-muted")
            }
          >
            <Upload className="size-10 text-muted-foreground mx-auto" />
            <p className="mt-3 text-sm">
              {file ? (
                <>
                  <span className="font-medium">{file.name}</span>
                  <Badge variant="secondary" className="ms-2">
                    {(file.size / 1024).toFixed(1)} KB
                  </Badge>
                </>
              ) : (
                <>اسحب الملف هنا أو اختر من جهازك</>
              )}
            </p>
            <input
              id="import-file-input"
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
              disabled={isPending}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3"
              asChild
            >
              <label htmlFor="import-file-input">
                {file ? "تغيير الملف" : "اختر ملفاً"}
              </label>
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-end">
            <Button
              type="button"
              onClick={() => upload()}
              disabled={!file || isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {dryRun ? "تحليل الملف" : "بدء الاستيراد"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
