"use client"

import { cn } from "@workspace/ui/lib/utils"
import * as React from "react"

/** Messages shown in sequence while the store setup request is in progress. */
export const STORE_SETUP_LOADING_MESSAGES = [
  "يتم تجهيز متجرك",
  "يتم ضبط الإعدادات الأولية",
  "قليلاً فقط",
  "تفضل بالدخول..",
] as const

export const DEFAULT_STORE_SETUP_MESSAGE_INTERVAL_MS = 2400

/** One full pass through all messages at the default interval (ms). */
export const STORE_SETUP_LOADER_FULL_CYCLE_MS =
  STORE_SETUP_LOADING_MESSAGES.length * DEFAULT_STORE_SETUP_MESSAGE_INTERVAL_MS

/** Set on successful store creation; home reads it to show the welcome loader once. */
export const SESSION_SHOW_STORE_SETUP_LOADER = "sooq:show-store-setup-loader"

export type FullPageLoaderProps = {
  /** When true, the overlay is visible and messages cycle. */
  active: boolean
  /** Time each message stays on screen (ms). Default 2400. */
  messageIntervalMs?: number
  /** If false, stops on the last message instead of looping. */
  loopMessages?: boolean
  className?: string
}

export function FullPageLoader({
  active,
  messageIntervalMs = DEFAULT_STORE_SETUP_MESSAGE_INTERVAL_MS,
  loopMessages = true,
  className,
}: FullPageLoaderProps) {
  const [step, setStep] = React.useState(0)
  const lastIndex = STORE_SETUP_LOADING_MESSAGES.length - 1

  React.useEffect(() => {
    if (!active) {
      setStep(0)
      return
    }

    const id = window.setInterval(() => {
      setStep((s) => {
        if (!loopMessages && s >= lastIndex) return s
        return (s + 1) % STORE_SETUP_LOADING_MESSAGES.length
      })
    }, messageIntervalMs)

    return () => window.clearInterval(id)
  }, [active, messageIntervalMs, loopMessages, lastIndex])

  React.useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])

  if (!active) return null

  const message = STORE_SETUP_LOADING_MESSAGES[step]!

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center gap-10 px-6",
        "bg-background/85 supports-backdrop-filter:backdrop-blur-md",
        className
      )}
    >
      <div className="relative flex size-28 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full border-[3px] border-primary/15"
          aria-hidden
        />
        <span
          className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-primary border-r-primary/50 duration-[1100ms] ease-linear"
          aria-hidden
        />
        <span
          className="absolute inset-3 animate-spin rounded-full border-2 border-transparent border-b-secondary border-l-secondary/40 duration-[1600ms] ease-linear [animation-direction:reverse]"
          aria-hidden
        />
        <span
          className="relative flex size-12 items-center justify-center rounded-full bg-primary/10 shadow-lg shadow-primary/20"
          aria-hidden
        >
          <span className="size-3 rounded-full bg-primary/90 shadow-sm ring-2 ring-primary/25" />
        </span>
      </div>

      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <p
          key={step}
          className="min-h-[3.5rem] text-balance text-xl font-semibold leading-relaxed tracking-tight text-foreground animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
        >
          {message}
        </p>

        <div className="flex items-center justify-center gap-2" aria-hidden>
          {STORE_SETUP_LOADING_MESSAGES.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-2 rounded-full transition-all duration-500 ease-out",
                i === step
                  ? "w-8 bg-primary"
                  : i < step
                    ? "w-2 bg-primary/45"
                    : "w-2 bg-muted-foreground/25"
              )}
            />
          ))}
        </div>
      </div>

      <span className="sr-only">جاري التحميل</span>
    </div>
  )
}
