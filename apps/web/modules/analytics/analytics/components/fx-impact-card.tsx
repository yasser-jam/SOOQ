import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { formatSyp } from "@/lib/money"

import type { FxRateEntry, FxImpactAnalytics } from "../types"

const formatRateEntry = (entry: FxRateEntry): string => {
  const currency = entry.currencyCode ?? entry.currency ?? "—"
  const rate = typeof entry.rate === "number" ? entry.rate : undefined
  return rate !== undefined ? `${currency}: ${rate}` : String(currency)
}

const FxRatesList = ({
  title,
  entries,
}: {
  title: string
  entries: FxRateEntry[]
}) => (
  <div className="space-y-2">
    <p className="text-sm font-bold text-text">{title}</p>
    {entries.length ? (
      <ul className="space-y-1.5">
        {entries.map((entry, index) => (
          <li
            key={`${formatRateEntry(entry)}-${index}`}
            className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
          >
            <span>{formatRateEntry(entry)}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-muted-foreground">لا توجد بيانات لهذه الفترة</p>
    )}
  </div>
)

type AnalyticsFxImpactCardProps = {
  data: FxImpactAnalytics
}

export function AnalyticsFxImpactCard({ data }: AnalyticsFxImpactCardProps) {
  return (
    <Card size="sm" className="gap-4">
      <CardHeader className="p-0">
        <CardTitle className="text-lg">تأثير سعر الصرف</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-0">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">الإيراد خلال الفترة</p>
            <p className="mt-1 font-heading text-xl font-bold tabular-nums">
              {formatSyp(data.revenueInPeriod)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              التغيّر المقدّر في الهامش
            </p>
            <p className="mt-1 font-heading text-xl font-bold tabular-nums">
              {formatSyp(data.marginDeltaEstimate)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FxRatesList title="أسعار الصرف الفعّالة" entries={data.activeRates} />
          <FxRatesList
            title="متوسط الأسعار من الطلبات"
            entries={data.averageRatesFromOrders}
          />
        </div>
      </CardContent>
    </Card>
  )
}
