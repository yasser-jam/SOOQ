"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useMutation } from "@tanstack/react-query"
import { FileSpreadsheet, History, Loader2, Plus, Settings2, Upload } from "lucide-react"
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
import { Switch } from "@workspace/ui/components/switch"

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
    <div className="container bg-[#F8F9FA] min-h-screen py-8">
      {/* Header - العنوان والوصف في اليمين، زر السجل في اليسار */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-[#1e3a47] tracking-tight">استيراد منتجات</h1>
          <p className="text-base text-gray-600 font-medium">
            ارفع ملفاً يحتوي بيانات المنتجات. يدعم العربية وحتى آلاف الصفوف.
          </p>
        </div>
        <Button asChild size="md" variant="secondary" className="bg-[#1e3a47] text-white hover:bg-[#152933]">
          <Link href={storePath("/products/import/batches")}>
            سجلّ عمليات الاستيراد
            <History data-icon="inline-end" />
          </Link>
        </Button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* منطقة الرفع - كارد رئيسي */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-gray-200/50 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#1e3a47]">رفع الملف</CardTitle>
              <CardDescription className="text-sm text-gray-600 font-medium">
                CSV أو XLSX. الحدّ الأقصى يتبع إعدادات الخادم.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* منطقة Dropzone المحسّنة */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragActive(true)
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
                className={`rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
                  dragActive
                    ? "border-[#B47D1C] bg-[#B47D1C]/5"
                    : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <FileSpreadsheet className="size-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {file ? (
                    <>
                      <span className="text-[#1e3a47]">{file.name}</span>
                      <Badge variant="secondary" className="ms-2">
                        {(file.size / 1024).toFixed(1)} KB
                      </Badge>
                    </>
                  ) : (
                    "اسحب الملف وأفلته هنا"
                  )}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  {file ? "أو" : "أو تصفح جهازك"}
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
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                  asChild
                >
                  <label htmlFor="import-file-input">
                    {file ? "تغيير الملف" : "اختر ملفاً"}
                  </label>
                </Button>
                <p className="text-xs text-gray-400 mt-4">
                  الصيغ المدعومة: CSV, XLSX
                </p>
              </div>

              {/* زر الإجراء الرئيسي */}
              <div className="mt-6 flex items-center justify-start">
                <Button
                  type="button"
                  onClick={() => upload()}
                  disabled={!file || isPending}
                  size="md"
                  variant="secondary"
                >
                  {dryRun ? "تحليل الملف" : "بدء الاستيراد"}
                  {isPending ? <Loader2 className="size-4 animate-spin" data-icon="inline-end" /> : <Plus data-icon="inline-end" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* كارد الإعدادات الإضافية */}
        <div>
          <Card className="rounded-2xl border-gray-200/50 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B47D1C]/10">
                <Settings2 className="size-5 text-[#B47D1C]" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-bold text-[#1e3a47]">إعدادات الاستيراد</CardTitle>
                <CardDescription className="text-sm text-gray-600 font-medium">
                  خيارات إضافية لعملية الاستيراد
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* Toggle Switch للتشغيل التجريبي */}
              <div className="flex items-center justify-between rounded-xl border border-gray-200/50 bg-gray-50/50 p-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-800">
                    تشغيل تجريبي
                  </label>
                  <p className="text-xs text-gray-500">
                    محاكاة لعملية الاستيراد للتحقق من الأخطاء دون حفظ البيانات
                  </p>
                </div>
                <Switch
                  checked={dryRun}
                  onCheckedChange={setDryRun}
                  disabled={isPending}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
