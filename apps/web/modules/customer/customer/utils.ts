const spendFormatter = new Intl.NumberFormat("ar-SY", {
  maximumFractionDigits: 0,
})

export const formatSpendSyp = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return spendFormatter.format(value)
}

const dateFormatter = new Intl.DateTimeFormat("ar-SY", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

export const formatDateArabic = (iso: string | null | undefined): string => {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return dateFormatter.format(d)
}

const relativeFormatter =
  typeof Intl !== "undefined" && "RelativeTimeFormat" in Intl
    ? new Intl.RelativeTimeFormat("ar", { numeric: "auto" })
    : null

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
]

export const formatRelativeArabic = (
  iso: string | null | undefined
): string => {
  if (!iso || !relativeFormatter) return formatDateArabic(iso)
  const target = new Date(iso).getTime()
  if (Number.isNaN(target)) return "—"
  let delta = (target - Date.now()) / 1000
  for (const division of DIVISIONS) {
    if (Math.abs(delta) < division.amount) {
      return relativeFormatter.format(Math.round(delta), division.unit)
    }
    delta /= division.amount
  }
  return formatDateArabic(iso)
}

export const buildCustomerSearchParams = (
  params: Record<string, unknown>
): URLSearchParams => {
  const usp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    usp.set(key, String(value))
  }
  return usp
}

export const triggerBrowserDownload = (blob: Blob, filename: string): void => {
  if (typeof window === "undefined") return
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
