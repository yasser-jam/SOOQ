import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
} from "axios"

import { handleApiError } from "@/lib/api-error"

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

export const publicApi = async <T = unknown>(
  url: string,
  options: PublicApiOptions
): Promise<T> => {
  const { body, headers, method = "GET", tenantId, ...rest } = options

  if (!tenantId) {
    throw new Error("publicApi: `tenantId` is required (UUID).")
  }
  if (!UUID_REGEX.test(tenantId)) {
    throw new Error(`publicApi: \`tenantId\` must be a UUID (got "${tenantId}").`)
  }

  const response = await publicApiInstance.request<T>({
    url,
    method,
    data: body,
    headers: {
      ...headers,
      [TENANT_ID_HEADER]: tenantId,
    },
    ...rest,
  })

  return response.data
}

export default publicApi
