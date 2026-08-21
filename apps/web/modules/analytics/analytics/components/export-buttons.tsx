"use client"

import { useMutation } from "@tanstack/react-query"
import { FileSpreadsheet, FileText } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"

import { exportAnalyticsCsv, exportAnalyticsPdf } from "../actions"
import type { AnalyticsPeriod } from "../types"

type AnalyticsExportButtonsProps = {
  period: AnalyticsPeriod
}

export function AnalyticsExportButtons({ period }: AnalyticsExportButtonsProps) {
  const csvMutation = useMutation({
    mutationFn: () => exportAnalyticsCsv(period),
    onError: () => toast.error("تعذّر تصدير الملف"),
  })

  const pdfMutation = useMutation({
    mutationFn: () => exportAnalyticsPdf(period),
    onError: () => toast.error("تعذّر تصدير الملف"),
  })

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="md"
        variant="outline"
        disabled={csvMutation.isPending}
        onClick={() => csvMutation.mutate()}
      >
        تصدير CSV
        <FileSpreadsheet data-icon="inline-end" />
      </Button>
      <Button
        type="button"
        size="md"
        variant="outline"
        disabled={pdfMutation.isPending}
        onClick={() => pdfMutation.mutate()}
      >
        تصدير PDF
        <FileText data-icon="inline-end" />
      </Button>
    </div>
  )
}
