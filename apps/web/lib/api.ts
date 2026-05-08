import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios"
import { toast } from "sonner"

import cookiesConfig from "@/config/cookies-config"
import { mapAuthError } from "@/lib/auth/error-codes"
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
      status === 401 &&
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

    return Promise.reject(handleError(error))
  }
)

const handleError = (error: AxiosError<unknown>) => {
  const responseData = (error.response?.data ?? null) as
    | {
        success?: boolean
        errorCode?: string
        message?: string
        fieldErrors?: Array<{ field?: string; message?: string }>
        retryAfterSeconds?: number
      }
    | null

  const status = error.response?.status
  const mapped = mapAuthError(responseData)

  // Suppress toast for handled actions:
  // - 401 refresh-and-retry already handled silently above
  // - field errors should be rendered inline by the caller
  // - cooldown is rendered inline
  const suppressToast =
    status === 401 ||
    mapped.action === "show-field-error" ||
    mapped.action === "show-cooldown" ||
    mapped.action === "hide-feature" ||
    mapped.action === "request-mfa"

  if (!suppressToast && typeof window !== "undefined") {
    toast.error(mapped.toastMessage)
  }

  if (error.response) {
    return {
      status: error.response.status,
      message: mapped.toastMessage,
      errorCode: mapped.errorCode,
      fieldKey: mapped.fieldKey,
      action: mapped.action,
      retryAfterSeconds: mapped.retryAfterSeconds,
      data: error.response.data,
    }
  }

  if (error.request) {
    return {
      status: 0,
      message: "لا يوجد اتصال بالخادم",
    }
  }

  return {
    status: 0,
    message: error.message,
  }
}

export type ApiOptions = Omit<AxiosRequestConfig, "url" | "data"> & {
  body?: AxiosRequestConfig["data"]
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

export type ApiError = ReturnType<typeof handleError>

export default api
