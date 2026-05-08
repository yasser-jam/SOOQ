import type { QueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"

import type { TenantSummary } from "./types"

export const platformKeys = {
  all: ["platform-tenants"] as const,
}

type Envelope<T> = {
  success: boolean
  data?: T
  message?: string
}

export const listPlatformTenants = async (): Promise<TenantSummary[]> => {
  const response = await api<Envelope<TenantSummary[]>>("/auth/platform/tenants")
  return response.data ?? []
}

export const listPlatformTenantsQueryOptions = () =>
  queryOptions({
    queryKey: platformKeys.all,
    queryFn: listPlatformTenants,
  })

export const disablePlatformTenant = async (
  tenantId: string
): Promise<{ tenantId: string }> => {
  await api<Envelope<unknown>>(`/auth/platform/tenants/${tenantId}/disable`, {
    method: "POST",
  })
  return { tenantId }
}

export const getDisablePlatformTenantMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (tenantId: string) => void
}) => ({
  mutationFn: disablePlatformTenant,
  onSuccess: ({ tenantId }: { tenantId: string }) => {
    queryClient.invalidateQueries({ queryKey: platformKeys.all })
    onSuccess?.(tenantId)
  },
})
