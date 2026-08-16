"use client"

import { useCallback, useMemo, useState } from "react"
import { Database, Loader2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import {
  runProductSeed,
  runProductsOnlySeed,
} from "@/modules/product/seed/actions"
import type { SeedDataset } from "@/modules/product/seed/dataset"
import type { SeedProgress } from "@/modules/product/seed/types"

const INITIAL_PROGRESS: SeedProgress = {
  phase: "idle",
  current: 0,
  total: 0,
  message: "",
  errors: [],
}

function progressPercent(progress: SeedProgress): number {
  if (progress.phase === "done") return 100
  if (progress.phase === "idle" || progress.total <= 0) return 0
  return Math.min(100, Math.round((progress.current / progress.total) * 100))
}

function phaseLabel(phase: SeedProgress["phase"]): string {
  switch (phase) {
    case "checking":
      return "تحقق"
    case "categories":
      return "فئات"
    case "tags":
      return "وسوم"
    case "attributes":
      return "سمات"
    case "images":
      return "صور"
    case "products":
      return "منتجات"
    case "collections":
      return "مجموعات"
    case "done":
      return "اكتمل"
    case "error":
      return "خطأ"
    default:
      return ""
  }
}

export type SeedDatasetCardProps = {
  dataset: SeedDataset
  title: string
  /** optional lead-in sentence shown before the auto-generated counts */
  description?: string
  actionLabel: string
  /**
   * Seed the products phase only, against a store whose categories/tags/
   * attributes already exist. Collections are skipped too.
   */
  productsOnly?: boolean
}

/**
 * Runs one `SeedDataset` through the seed pipeline and renders live progress.
 * Datasets are independent — running two of them on the same store reuses any
 * shared categories/tags/attributes instead of duplicating them.
 */
export function SeedDatasetCard({
  dataset,
  title,
  description,
  actionLabel,
  productsOnly = false,
}: SeedDatasetCardProps) {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<SeedProgress>(INITIAL_PROGRESS)

  const percent = useMemo(() => progressPercent(progress), [progress])
  const showProgress = progress.phase !== "idle"

  const counts = useMemo(
    () => ({
      categories: dataset.categories.length,
      tags: dataset.tags.length,
      attributes: dataset.attributes.length,
      products: dataset.products.length,
      collections: dataset.collections.length,
    }),
    [dataset]
  )

  const handleSeed = useCallback(async () => {
    if (running) return
    setRunning(true)
    setProgress({
      phase: "checking",
      current: 0,
      total: 0,
      message: "بدء التهيئة…",
      errors: [],
    })

    const run = productsOnly ? runProductsOnlySeed : runProductSeed
    await run(setProgress, dataset)
    setRunning(false)
  }, [running, dataset, productsOnly])

  return (
    <Card size="sm" className="border-dashed">
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="size-4" aria-hidden />
          {title}
        </CardTitle>
        <CardDescription>
          {description ? `${description} ` : null}
          {productsOnly ? (
            <>
              يضيف {counts.products} منتج فقط مع صورة أو صورتين لكل منتج،
              ويستخدم الفئات والوسوم والسمات الموجودة مسبقاً كما هي (بدون
              إنشاء أي منها ولا المجموعات). كل تشغيل يضيف نسخة جديدة بلاحقة
              عشوائية على الـ slug والـ SKU.
            </>
          ) : (
            <>
              ينشئ بالتسلسل: {counts.categories} فئة (مع فئات متداخلة)،{" "}
              {counts.tags} وسم، {counts.attributes} سمة، {counts.products} منتج
              (مع صورة أو صورتين لكل منتج)، و {counts.collections} مجموعة (يدوية
              وتلقائية). يتخطى ما هو موجود مسبقاً.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          onClick={handleSeed}
          disabled={running}
          className="gap-2"
        >
          {running ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              جاري الإنشاء…
            </>
          ) : (
            actionLabel
          )}
        </Button>

        {showProgress ? (
          <div className="space-y-2" aria-live="polite">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                {phaseLabel(progress.phase)}
                {progress.total > 0
                  ? ` · ${progress.current}/${progress.total}`
                  : ""}
              </span>
              <span className="tabular-nums">{percent}%</span>
            </div>
            <div
              className="bg-muted h-2 w-full overflow-hidden rounded-full"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <div
                className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            {progress.message ? (
              <p className="text-muted-foreground text-sm">{progress.message}</p>
            ) : null}
            {progress.errors.length > 0 ? (
              <ul className="text-destructive max-h-32 space-y-1 overflow-y-auto text-xs">
                {progress.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
