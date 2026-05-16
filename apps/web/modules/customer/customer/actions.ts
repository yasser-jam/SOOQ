import cookiesConfig from "@/config/cookies-config"
import { api } from "@/lib/api"
import { getCookie } from "@/lib/cookies"
import type { ApiResponse, PagedApiResponse } from "@/lib/types"

import {
  buildCustomerSearchParams,
  triggerBrowserDownload,
} from "./utils"
import type {
  AdminCustomerDetail,
  AdminCustomerSearchRequest,
  AdminCustomerSummary,
} from "./types"

export const listAdminCustomers = async (
  params: AdminCustomerSearchRequest
): Promise<PagedApiResponse<AdminCustomerSummary>> => {
  const response = await api<PagedApiResponse<AdminCustomerSummary>>(
    "/admin/customers",
    { params }
  )

  return response
}

export const getAdminCustomer = async (
  customerId: string
): Promise<AdminCustomerDetail> => {
  const response = await api<ApiResponse<AdminCustomerDetail>>(
    `/admin/customers/${customerId}`
  )

  return response.data as AdminCustomerDetail
}

/**
 * Stream the CSV through the browser fetch API (not the shared axios `api`)
 * to preserve the UTF-8 BOM and binary blob — going through axios would
 * decode the body as JSON and corrupt the bytes. See CUS-FRONTEND-GUIDE
 * Part E ("CSV opens in Excel with mojibake").
 */
export const exportAdminCustomersCsv = async (
  params: AdminCustomerSearchRequest
): Promise<void> => {
  const token = getCookie(cookiesConfig.accessToken)
  const qs = buildCustomerSearchParams(
    params as Record<string, unknown>
  ).toString()
  const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/customers/export.csv${
    qs ? `?${qs}` : ""
  }`

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!res.ok) {
    throw new Error(`CSV export failed (${res.status})`)
  }

  const blob = await res.blob()
  const disposition = res.headers.get("Content-Disposition") ?? ""
  const match = disposition.match(/filename="?([^";]+)"?/i)
  const fallback = `customers-${new Date().toISOString().slice(0, 10)}.csv`
  triggerBrowserDownload(blob, match?.[1] ?? fallback)
}
