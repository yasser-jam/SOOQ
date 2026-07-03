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

apiInstance.interceptors.request.use(
  (config) => {
    const token = getCookie(cookiesConfig.accessToken)
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`)
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
        addCookie(cookiesConfig.accessToken, result.accessToken)
        return result.accessToken
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

const redirectToLogin = () => {
  if (typeof window === "undefined") return
  // Only redirect when a merchant session exists. Without an access token the
  // caller was never authenticated (e.g. a storefront visitor in apps/store),
  // so there is no need to redirect to the OTP login page.
  const hadSession = !!getCookie(cookiesConfig.accessToken)
  if (!hadSession) return
  removeCookie(cookiesConfig.accessToken)
  removeCookie(cookiesConfig.tenantSlug)
  window.location.href = "/request-otp"
}

apiInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined
    const status = error.response?.status

    if (
      (status === 401 || status == 403) &&
      original &&
      !original._retry &&
      !isInternalAuthRequest(original.url)
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
  const { body, headers, method = "GET", ...rest } = options

  const response = await apiInstance.request<T>({
    url,
    method,
    data: body,
    headers: { ...headers },
    ...rest,
  })

  return response.data
}

export type { ApiErrorShape as ApiError } from "@/lib/api-error"

export default api
