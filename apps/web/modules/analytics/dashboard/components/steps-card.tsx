"use client"

import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Check } from "lucide-react"

export type StepItem = {
  key: string
  title: string
  desc: string
  done: boolean
  cta?: string
  ctaHref?: string
}

type StepsCardProps = {
  steps: StepItem[]
  loading?: boolean
}

export function StepsCard({ steps, loading }: StepsCardProps) {
  const completedSteps = steps.filter((step) => step.done).length
  const progressPercent = steps.length
    ? Math.round((completedSteps / steps.length) * 100)
    : 0
  const nextStepKey = steps.find((step) => !step.done)?.key

  return (
    <Card size="sm" className="gap-5.5">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-4 p-0">
        <div>
          <CardTitle className="mb-1.5 text-lg">خطوات تهيئة متجرك</CardTitle>
          <CardDescription>
            أنجزت {completedSteps} من {steps.length}
            {completedSteps < steps.length
              ? ` خطوات. تبقّت ${steps.length - completedSteps}.`
              : " خطوات."}
          </CardDescription>
        </div>
        <div className="flex min-w-[120px] flex-col items-end gap-2">
          <span className="text-secondary text-xl font-bold">
            {progressPercent}٪
          </span>
          <div className="bg-muted h-1.5 w-30 overflow-hidden rounded-full">
            <div
              className="bg-secondary h-full rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 p-0">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[68px] w-full rounded-2xl" />
            ))
          : steps.map((step) => {
              const isNext = step.key === nextStepKey
              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3.5 rounded-2xl border p-4 ${
                    step.done
                      ? "border-emerald-200 bg-emerald-50"
                      : isNext
                        ? "border-secondary/60 border-2 bg-secondary/5"
                        : "border-border bg-muted/30"
                  }`}
                >
                  <span
                    className={`flex size-6.5 shrink-0 items-center justify-center rounded-full ${
                      step.done
                        ? "bg-emerald-500 text-white"
                        : "border-muted-foreground/40 border-2 border-dashed"
                    }`}
                  >
                    {step.done && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p
                      className={`text-sm font-bold ${
                        step.done ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-muted-foreground text-[13px] leading-6">
                      {step.desc}
                    </p>
                  </div>
                  {!step.done && step.cta && step.ctaHref && (
                    <Button
                      size="sm"
                      variant={isNext ? "secondary" : "outline"}
                      className="shrink-0"
                      asChild
                    >
                      <Link href={step.ctaHref}>{step.cta}</Link>
                    </Button>
                  )}
                </div>
              )
            })}
      </CardContent>
    </Card>
  )
}
