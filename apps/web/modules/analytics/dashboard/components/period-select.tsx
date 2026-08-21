"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { DashboardPeriod } from "../types"

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  DAY: "اليوم",
  WEEK: "الأسبوع",
  MONTH: "الشهر",
  YEAR: "السنة",
}
const PERIODS = Object.keys(PERIOD_LABELS) as DashboardPeriod[]

type DashboardPeriodSelectProps = {
  value: DashboardPeriod
  onChange: (period: DashboardPeriod) => void
}

export function DashboardPeriodSelect({
  value,
  onChange,
}: DashboardPeriodSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DashboardPeriod)}>
      <SelectTrigger size="sm" className="w-32">
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
