"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Coins, DollarSign } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type CurrencyCode = "SYP" | "USD"

const ITEMS: {
  code: CurrencyCode
  shortLabel: string
  Icon: LucideIcon
}[] = [
  { code: "SYP", shortLabel: "ليرة سورية", Icon: Coins },
  { code: "USD", shortLabel: "دولار أمريكي", Icon: DollarSign },
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
    <div className={cn("grid gap-2", className)}>
      <span className="flex items-center gap-2 text-sm leading-none font-medium">
        <Coins className="size-4 shrink-0" aria-hidden />
        العملة الافتراضية
      </span>
      <div
        className="grid grid-cols-2 gap-2"
        role="group"
        aria-label={ariaLabel}
      >
        {ITEMS.map(({ code, shortLabel, Icon }) => {
          const selected = value === code
          return (
            <Button
              key={code}
              type="button"
              variant={selected ? "default" : "outline"}
              size="sm"
              className="h-auto min-h-0 flex-col gap-0.5 py-2"
              aria-pressed={selected}
              onClick={() => onValueChange(code)}
            >
              <Icon className="size-3.5" strokeWidth={2} />
              <span className="text-xs font-medium leading-tight">{shortLabel}</span>
              <span className="text-muted-foreground text-[0.6rem] font-normal leading-none">
                {code}
              </span>
            </Button>
          )
        })}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  )
}
