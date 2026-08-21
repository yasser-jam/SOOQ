import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"

import type {
  AnalyticsPeriod,
  FxImpactAnalytics,
  ProfitAnalytics,
  RevenueAnalytics,
} from "./types"

type Envelope<T> = {
  success?: boolean
  data?: T
  message?: string | null
}

export const analyticsKeys = {
  all: ["analytics"] as const,
  revenue: (period: AnalyticsPeriod) =>
    [...analyticsKeys.all, "revenue", period] as const,
  profit: (period: AnalyticsPeriod) =>
    [...analyticsKeys.all, "profit", period] as const,
  fxImpact: (period: AnalyticsPeriod) =>
    [...analyticsKeys.all, "fx-impact", period] as const,
}

export const getRevenueAnalytics = async (
  period: AnalyticsPeriod
): Promise<RevenueAnalytics> => {
  const response = await api<Envelope<RevenueAnalytics>>(
    "/admin/analytics/revenue",
    { params: { period } }
  )
  return response.data!
}

export const getRevenueAnalyticsQueryOptions = (period: AnalyticsPeriod) =>
  queryOptions({
    queryKey: analyticsKeys.revenue(period),
    queryFn: () => getRevenueAnalytics(period),
  })

export const getProfitAnalytics = async (
  period: AnalyticsPeriod
): Promise<ProfitAnalytics> => {
  const response = await api<Envelope<ProfitAnalytics>>(
    "/admin/analytics/profit",
    { params: { period } }
  )
  return response.data!
}

export const getProfitAnalyticsQueryOptions = (period: AnalyticsPeriod) =>
  queryOptions({
    queryKey: analyticsKeys.profit(period),
    queryFn: () => getProfitAnalytics(period),
  })

export const getFxImpactAnalytics = async (
  period: AnalyticsPeriod
): Promise<FxImpactAnalytics> => {
  const response = await api<Envelope<FxImpactAnalytics>>(
    "/admin/analytics/fx-impact",
    { params: { period } }
  )
  return response.data!
}

export const getFxImpactAnalyticsQueryOptions = (period: AnalyticsPeriod) =>
  queryOptions({
    queryKey: analyticsKeys.fxImpact(period),
    queryFn: () => getFxImpactAnalytics(period),
  })

const triggerBlobDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const exportAnalyticsCsv = async (
  period: AnalyticsPeriod
): Promise<void> => {
  const blob = await api<Blob>("/admin/analytics/export/csv", {
    params: { period },
    responseType: "blob",
  })
  triggerBlobDownload(blob, `analytics-${period.toLowerCase()}.csv`)
}

export const exportAnalyticsPdf = async (
  period: AnalyticsPeriod
): Promise<void> => {
  const blob = await api<Blob>("/admin/analytics/export/pdf", {
    params: { period },
    responseType: "blob",
  })
  triggerBlobDownload(blob, `analytics-${period.toLowerCase()}.pdf`)
}
