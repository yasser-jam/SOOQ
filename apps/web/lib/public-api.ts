import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
} from "axios"

import { handleApiError } from "@/lib/api-error"
import { isMockApiEnabled, MockApiError, tryHandleMockApi } from "@/lib/mock"

/**
 * HTTP client for unauthenticated tenant-scoped endpoints under `/api/v1/**`.
 *
 * The backend's `TenantFilter` (see SOOQ-Back commit 052ac838) resolves the
 * tenant from an `X-Tenant-Id: <uuid>` header for these endpoints. If a
 * caller sends both a Bearer token *and* a non-matching `X-Tenant-Id`
 * header, the filter rejects the request with 401 — so this helper uses a
 * dedicated axios instance that never attaches the access-token cookie.
 *
 * Callers must pass an explicit `tenantId` (UUID). The storefront layout
 * is responsible for resolving the URL slug (e.g. `kemo`) → tenant UUID
 * via a public lookup endpoint before issuing public-API calls. Until that
 * lookup endpoint exists, treat the tenantId as a value that comes from
 * page props / a context wrapped around `app/shop/[storeSlug]/...`.
 *
 * When `NEXT_PUBLIC_USE_MOCK_API=true`, covered public paths
 * (`/public/collections*`, `/public/products*`) are served from the
 * in-browser mock DB and the UUID check is relaxed.
 */
const TENANT_ID_HEADER = "X-Tenant-Id"
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const publicApiInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

publicApiInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(handleApiError(error))
)

export type PublicApiOptions = Omit<AxiosRequestConfig, "url" | "data"> & {
  body?: AxiosRequestConfig["data"]
  /** Tenant UUID for the storefront the call belongs to. Required. */
  tenantId: string
}

const appendParams = (
  url: string,
  params?: AxiosRequestConfig["params"]
): string => {
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
}

export const publicApi = async <T = unknown>(
  url: string,
  options: PublicApiOptions
): Promise<T> => {
  const { body, headers, method = "GET", tenantId, params, ...rest } = options

  if (!tenantId) {
    throw new Error("publicApi: `tenantId` is required (UUID).")
  }

  const mockUrl = appendParams(url, params)

  const requestHeaders: Record<string, string | undefined> = {
    ...(headers as Record<string, string | undefined> | undefined),
    [TENANT_ID_HEADER]: tenantId,
  }

  if (isMockApiEnabled()) {
    try {
      const mockData = await tryHandleMockApi<T>(mockUrl, {
        method,
        body,
        headers: requestHeaders,
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
  }

  if (!UUID_REGEX.test(tenantId)) {
    throw new Error(`publicApi: \`tenantId\` must be a UUID (got "${tenantId}").`)
  }

  const response = await publicApiInstance.request<T>({
    url,
    method,
    data: body,
    headers: requestHeaders,
    params,
    ...rest,
  })

  return response.data
}

export default publicApi
