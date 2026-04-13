import { cn } from "@workspace/ui/lib/utils"
import * as React from "react"

const STEPS = [
  { title: "التصنيف" },
  { title: "بيانات المتجر" },
  { title: "الرابط والعملة" },
] as const

type OnboardingProgressProps = {
  currentStep: number
  className?: string
}

export function OnboardingProgress({
  currentStep,
  className,
}: OnboardingProgressProps) {
  return (
    <nav
      aria-label="تقدم إعداد المتجر"
      className={cn("w-full max-w-md px-2", className)}
    >
      <div className="flex w-full items-center">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.title}>
            <div className="flex shrink-0 flex-col items-center gap-2">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  index <= currentStep
                    ? "border-secondary bg-secondary text-secondary-foreground"
                    : "border-muted-foreground/30 bg-background text-muted-foreground"
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "max-w-[4.75rem] text-center text-[0.7rem] leading-tight sm:text-xs sm:leading-tight",
                  index === currentStep
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-1 min-h-px min-w-[0.75rem] flex-1 rounded-full transition-colors sm:mx-2",
                  currentStep > index ? "bg-secondary" : "bg-muted-foreground/25"
                )}
                aria-hidden
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  )
}
