"use client"

import { cn } from "@workspace/ui/lib/utils"
import { Coins, DollarSign } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type CurrencyCode = "SYP" | "USD"

const ITEMS: {
  code: CurrencyCode
  shortLabel: string
  Icon: LucideIcon
}[] = [
  { code: "SYP", shortLabel: "ل.س", Icon: Coins },
  { code: "USD", shortLabel: "$", Icon: DollarSign },
]

type CurrencyButtonGroupProps = {
  value: CurrencyCode
  onValueChange: (code: CurrencyCode) => void
  name?: string
  className?: string
  "aria-label"?: string
}

export function CurrencyButtonGroup({
  value,
  onValueChange,
  name = "primaryCurrencyCode",
  className,
  "aria-label": ariaLabel = "العملة الافتراضية",
}: CurrencyButtonGroupProps) {
  return (
    <div className={cn("w-full", className)}>
      <div
        className="inline-flex items-center bg-gray-100 rounded-xl p-1 w-full"
        role="group"
        aria-label={ariaLabel}
      >
        {ITEMS.map(({ code, shortLabel, Icon }) => {
          const selected = value === code
          return (
            <button
              key={code}
              type="button"
              onClick={() => onValueChange(code)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                selected
                  ? "bg-white text-[#1e3a47] shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              )}
              aria-pressed={selected}
            >
              <Icon className="size-4" strokeWidth={2} />
              <span>{shortLabel}</span>
            </button>
          )
        })}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  )
}
