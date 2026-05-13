import type { QueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"

import type {
  TenantSummary,
  UpdateStoreRateLimitInput,
  UpdateStoreStatusInput,
} from "./types"

export const storeKeys = {
  all: ["stores"] as const,
  detail: (tenantId: string) => [...storeKeys.all, tenantId] as const,
}

type Envelope<T> = {
  success: boolean
  data?: T
  message?: string
}

export const updateStoreStatus = async ({
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
  if (!response.data) {
    throw new Error("Empty store-status response")
  }
  return response.data
}

export const updateStoreRateLimit = async ({
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
  if (!response.data) {
    throw new Error("Empty rate-limit response")
  }
  return response.data
}

export const getUpdateStoreStatusMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (tenant: TenantSummary) => void
}) => ({
  mutationFn: updateStoreStatus,
  onSuccess: (tenant: TenantSummary) => {
    queryClient.setQueryData(storeKeys.detail(tenant.tenantId), tenant)
    queryClient.invalidateQueries({ queryKey: storeKeys.all })
    onSuccess?.(tenant)
  },
})

export const getUpdateStoreRateLimitMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (tenant: TenantSummary) => void
}) => ({
  mutationFn: updateStoreRateLimit,
  onSuccess: (tenant: TenantSummary) => {
    queryClient.setQueryData(storeKeys.detail(tenant.tenantId), tenant)
    queryClient.invalidateQueries({ queryKey: storeKeys.all })
    onSuccess?.(tenant)
  },
})
