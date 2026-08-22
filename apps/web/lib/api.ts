import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios"

import cookiesConfig from "@/config/cookies-config"
import { handleApiError } from "@/lib/api-error"
import { refreshSession, logoutSession } from "@/lib/auth/internal"
import { addCookie, getCookie, removeCookie } from "@/lib/cookies"
import { MockApiError, tryHandleMockApi } from "@/lib/mock"
import { clearTenantSlug, getTenantSlug, setTenantSlug } from "@/lib/tenant-slug"

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

const apiInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  // Don't set a default Content-Type. Axios auto-picks the right header per
  // body type: application/json for plain objects, multipart/form-data with
  // boundary for FormData, etc. Setting a default here kills that detection.
})

const INTERNAL_AUTH_PATHS = [
  "/api/auth/refresh",
  "/api/auth/session",
  "/api/auth/logout",
]
const BACKEND_REFRESH_PATH = "/auth/refresh"

const isInternalAuthRequest = (url?: string): boolean => {
  if (!url) return false
  return (
    INTERNAL_AUTH_PATHS.some((p) => url.includes(p)) ||
    url.includes(BACKEND_REFRESH_PATH)
  )
}

const isCustomerApiRequest = (url?: string): boolean => {
  if (!url) return false
  return url.includes("/customer/")
}

/** Admin JWT for merchant APIs; storefront customer JWT for `/customer/**`. */
const resolveBearerToken = (url?: string): string | undefined => {
  if (isCustomerApiRequest(url)) {
    return getCookie(cookiesConfig.storeAccessToken)
  }
  return getCookie(cookiesConfig.adminAccessToken)
}

apiInstance.interceptors.request.use(
  (config) => {
    const token = resolveBearerToken(config.url)
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`)
    }

    // Merchant APIs: attach store slug from localStorage (cookie fallback).
    // Skip customer + internal auth — those don't use the merchant tenant header.
    if (!isCustomerApiRequest(config.url) && !isInternalAuthRequest(config.url)) {
      const tenantSlug = getTenantSlug()
      if (tenantSlug && !config.headers.get("X-Tenant-Slug")) {
        config.headers.set("X-Tenant-Slug", tenantSlug)
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

let refreshPromise: Promise<string | null> | null = null

const triggerRefresh = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = refreshSession()
      .then((result) => {
        if (!result?.accessToken) return null
        addCookie(cookiesConfig.adminAccessToken, result.accessToken)
        if (result.tenantSlug) {
          setTenantSlug(result.tenantSlug)
        }
        return result.accessToken
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

const AUTH_LOGIN_PATHS = ["/request-otp", "/verify-otp"]

const isOnAuthLoginPage = (): boolean => {
  if (typeof window === "undefined") return false
  const path = window.location.pathname
  return AUTH_LOGIN_PATHS.some(
    (route) => path === route || path.startsWith(`${route}/`)
  )
}

const redirectToLogin = () => {
  if (typeof window === "undefined") return
  removeCookie(cookiesConfig.adminAccessToken)
  removeCookie(cookiesConfig.tenantSlug)
  clearTenantSlug()
  if (isOnAuthLoginPage()) return
  window.location.href = "/request-otp"
}

const shouldHandleMerchantAuthError = (
  status: number | undefined,
  url?: string
): boolean => {
  if (status !== 401 && status !== 403) return false
  if (isInternalAuthRequest(url)) return false
  // Customer storefront sessions have no merchant refresh cookie — don't
  // run the admin refresh/logout loop for `/customer/**`.
  if (isCustomerApiRequest(url)) return false
  return true
}

apiInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined
    const status = error.response?.status

    // 403 = forbidden / invalid session for merchant APIs → go to login now.
    // if (shouldHandleMerchantAuthError(status, original?.url) && status === 403) {
    //   await logoutSession().catch(() => undefined)
    //   redirectToLogin()
    //   return Promise.reject(handleApiError(error))
    // }

    if (
      shouldHandleMerchantAuthError(status, original?.url) &&
      original &&
      !original._retry
    ) {
      original._retry = true

      const newToken = await triggerRefresh()
      if (newToken) {
        original.headers.set("Authorization", `Bearer ${newToken}`)
        return apiInstance.request(original)
      }

      // Refresh failed — best-effort logout + redirect.
      await logoutSession().catch(() => undefined)
      redirectToLogin()
    }

    return Promise.reject(handleApiError(error))
  }
)

export type ApiOptions = Omit<AxiosRequestConfig, "url" | "data"> & {
  body?: AxiosRequestConfig["data"]
}

/** Base URL from env, without trailing slash. */
export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "")
}

/** Prefix relative API paths with `NEXT_PUBLIC_API_URL`; leave absolute URLs unchanged. */
export function toFullApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const base = getApiBaseUrl()
  if (!base) return path
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalizedPath}`
}

export const api = async <T = unknown>(
  url: string,
  options: ApiOptions = {}
): Promise<T> => {
  const { body, headers, method = "GET", params, ...rest } = options

  const mockUrl = (() => {
    if (!params || typeof params !== "object") return url
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(
      params as Record<string, unknown>
    )) {
      if (value == null) continue
      search.set(key, String(value))
    }
    const qs = search.toString()
    if (!qs) return url
    return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`
  })()

  try {
    const mockData = await tryHandleMockApi<T>(mockUrl, {
      method,
      body,
      headers,
    })
    if (mockData !== null) return mockData
  } catch (error) {
    if (error instanceof MockApiError) {
      throw {
        status: error.status,
        message: error.message,
        errorCode: error.errorCode,
        fieldKey: error.fieldKey,
        action: error.action,
        data: error.data,
      }
    }
    throw error
  }

  const response = await apiInstance.request<T>({
    url,
    method,
    data: body,
    headers: { ...headers },
    params,
    ...rest,
  })

  return response.data
}

export type { ApiErrorShape as ApiError } from "@/lib/api-error"

export default api
