import type { QueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"

import { tenantKeys } from "./queryKeys"
import type {
  SlugAvailability,
  TenantSummary,
  UpdateIdentityInput,
  UpdateStoreRateLimitInput,
  UpdateStoreStatusInput,
  UploadedMedia,
} from "./types"

type Envelope<T> = {
  success: boolean
  data?: T
  message?: string
}

const tenantHeaders = (tenantId: string) => ({
  "X-Tenant-Id": tenantId,
})

export const listTenants = async (): Promise<TenantSummary[]> => {
  const response = await api<Envelope<TenantSummary[]>>("/auth/platform/tenants")
  return response.data ?? []
}

export const listTenantsQueryOptions = () =>
  queryOptions({
    queryKey: tenantKeys.all,
    queryFn: listTenants,
  })

export const disableTenant = async (tenantId: string): Promise<{ tenantId: string }> => {
  await api<Envelope<unknown>>(`/auth/platform/tenants/${tenantId}/disable`, {
    method: "POST",
  })
  return { tenantId }
}

export const updateTenantStatus = async ({
  tenantId,
  data,
}: {
  tenantId: string
  data: UpdateStoreStatusInput
}): Promise<TenantSummary> => {
  const payload: Record<string, unknown> = {
    status: data.status,
    maintenanceMessage: data.maintenanceMessage?.trim() || undefined,
  }
  if (data.status === "PASSWORD_PROTECTED") {
    payload.storePassword = data.storePassword?.trim()
  }

  const response = await api<Envelope<TenantSummary>>(
    `/auth/stores/${tenantId}/status`,
    { method: "POST", body: payload }
  )
  if (!response.data) throw new Error("Empty store-status response")
  return response.data
}

export const updateTenantRateLimit = async ({
  tenantId,
  data,
}: {
  tenantId: string
  data: UpdateStoreRateLimitInput
}): Promise<TenantSummary> => {
  const response = await api<Envelope<TenantSummary>>(
    `/auth/stores/${tenantId}/rate-limit`,
    { method: "POST", body: data }
  )
  if (!response.data) throw new Error("Empty rate-limit response")
  return response.data
}

export const checkSlug = async (
  slug: string,
  tenantId: string
): Promise<SlugAvailability> => {
  const trimmed = slug.trim()
  const response = await api<unknown>(
    `/admin/store/settings/check-slug?slug=${encodeURIComponent(trimmed)}`,
    { headers: tenantHeaders(tenantId) }
  )

  if (typeof response === "boolean") {
    return { available: response, slug: trimmed }
  }
  if (response && typeof response === "object") {
    const obj = response as { data?: unknown; available?: unknown }
    if (typeof obj.data === "boolean") {
      return { available: obj.data, slug: trimmed }
    }
    if (typeof obj.available === "boolean") {
      return { available: obj.available, slug: trimmed }
    }
  }
  return { available: false, slug: trimmed }
}

export const updateTenantIdentity = async ({
  tenantId,
  data,
}: {
  tenantId: string
  data: UpdateIdentityInput
}): Promise<TenantSummary> => {
  const response = await api<Envelope<TenantSummary>>("/admin/store/settings", {
    method: "PUT",
    body: data,
    headers: tenantHeaders(tenantId),
  })
  if (!response.data) throw new Error("Empty update-settings response")
  return response.data
}

export const uploadLogo = async (files: File[]): Promise<UploadedMedia[]> => {
  if (files.length === 0) return []
  const formData = new FormData()
  files.forEach((file) => formData.append("files", file))
  const response = await api<Envelope<UploadedMedia[]>>("/media/upload", {
    method: "POST",
    body: formData,
  })
  return response.data ?? []
}

export const getDisableTenantMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (tenantId: string) => void
}) => ({
  mutationFn: disableTenant,
  onSuccess: ({ tenantId }: { tenantId: string }) => {
    queryClient.invalidateQueries({ queryKey: tenantKeys.all })
    onSuccess?.(tenantId)
  },
})

export const getUpdateStatusMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (tenant: TenantSummary) => void
}) => ({
  mutationFn: updateTenantStatus,
  onSuccess: (tenant: TenantSummary) => {
    queryClient.setQueryData(tenantKeys.detail(tenant.tenantId), tenant)
    queryClient.invalidateQueries({ queryKey: tenantKeys.all })
    onSuccess?.(tenant)
  },
})

export const getUpdateRateLimitMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (tenant: TenantSummary) => void
}) => ({
  mutationFn: updateTenantRateLimit,
  onSuccess: (tenant: TenantSummary) => {
    queryClient.setQueryData(tenantKeys.detail(tenant.tenantId), tenant)
    queryClient.invalidateQueries({ queryKey: tenantKeys.all })
    onSuccess?.(tenant)
  },
})

export const getUpdateIdentityMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (tenant: TenantSummary) => void
}) => ({
  mutationFn: updateTenantIdentity,
  onSuccess: (tenant: TenantSummary) => {
    queryClient.invalidateQueries({ queryKey: tenantKeys.all })
    onSuccess?.(tenant)
  },
})

export const getUploadLogoMutationOptions = ({
  onSuccess,
}: {
  onSuccess?: (items: UploadedMedia[]) => void
} = {}) => ({
  mutationFn: uploadLogo,
  onSuccess: (items: UploadedMedia[]) => onSuccess?.(items),
})
