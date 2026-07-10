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

import { runProductSeed } from "@/modules/product/seed/actions"
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
    case "products":
      return "منتجات"
    case "done":
      return "اكتمل"
    case "error":
      return "خطأ"
    default:
      return ""
  }
}

export function SeedProductsButton() {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<SeedProgress>(INITIAL_PROGRESS)

  const percent = useMemo(() => progressPercent(progress), [progress])
  const showProgress = progress.phase !== "idle"

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

    await runProductSeed(setProgress)
    setRunning(false)
  }, [running])

  return (
    <Card size="sm" className="border-dashed">
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="size-4" aria-hidden />
          تهيئة منتجات تجريبية
        </CardTitle>
        <CardDescription>
          يتحقق من الفئات والوسوم أولاً، ينشئ الناقص منها، ثم يضيف منتجات
          DummyJSON المرتبطة بها.
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
            "إنشاء المنتجات"
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
