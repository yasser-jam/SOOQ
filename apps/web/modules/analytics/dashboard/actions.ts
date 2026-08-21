import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type { DashboardAnalytics, DashboardPeriod } from "./types"

export const dashboardKeys = {
  all: ["dashboard"] as const,
  analytics: (period: DashboardPeriod) =>
    [...dashboardKeys.all, "analytics", period] as const,
}

export const getDashboardAnalytics = async (
  period: DashboardPeriod
): Promise<DashboardAnalytics> => {
  const response = await api<ApiResponse<DashboardAnalytics>>(
    "/admin/analytics/dashboard",
    { params: { period } }
  )
  if (!response.data) throw new Error("Empty dashboard-analytics response")
  return response.data
}

export const getDashboardAnalyticsQueryOptions = (period: DashboardPeriod) =>
  queryOptions({
    queryKey: dashboardKeys.analytics(period),
    queryFn: () => getDashboardAnalytics(period),
  })
