"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { AnalyticsPeriod } from "../types"

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  WEEK: "الأسبوع",
  MONTH: "الشهر",
  YEAR: "السنة",
}

const PERIODS = Object.keys(PERIOD_LABELS) as AnalyticsPeriod[]

type AnalyticsPeriodSelectProps = {
  value: AnalyticsPeriod
  onChange: (period: AnalyticsPeriod) => void
}

export function AnalyticsPeriodSelect({
  value,
  onChange,
}: AnalyticsPeriodSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AnalyticsPeriod)}>
      <SelectTrigger size="sm" className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIODS.map((period) => (
          <SelectItem key={period} value={period}>
            {PERIOD_LABELS[period]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
