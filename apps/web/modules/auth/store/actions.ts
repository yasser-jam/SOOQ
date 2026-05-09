import type { QueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { setSessionTokens } from "@/lib/auth/internal"
import { authKeys } from "@/modules/auth/auth/actions"
import { REGISTRATION_HUB_SLUG } from "@/modules/auth/auth/types"

import type {
  CreateStoreInput,
  StoreRegistrationResponse,
  TenantSummary,
  UpdateStoreRateLimitInput,
  UpdateStoreStatusInput,
} from "./types"

export const storeKeys = {
  all: ["stores"] as const,
  detail: (tenantId: string) => [...storeKeys.all, tenantId] as const,
  slugAvailability: (slug: string) =>
    [...storeKeys.all, "slug-availability", slug] as const,
}

type Envelope<T> = {
  success: boolean
  data?: T
  message?: string
}

export type SlugAvailability = {
  available: boolean
  slug: string
}

export const checkStoreSlug = async (
  slug: string
): Promise<SlugAvailability> => {
  const trimmed = slug.trim()
  // Backend may return the envelope shape, a raw boolean, or {available: boolean}.
  // Normalize defensively so the caller doesn't have to care.
  const response = await api<unknown>(
    `/auth/stores/check-slug?slug=${encodeURIComponent(trimmed)}`
  )

  if (typeof response === "boolean") {
    return { available: response, slug: trimmed }
  }
  if (response && typeof response === "object") {
    const obj = response as {
      data?: unknown
      available?: unknown
    }
    if (typeof obj.data === "boolean") {
      return { available: obj.data, slug: trimmed }
    }
    if (
      obj.data &&
      typeof obj.data === "object" &&
      typeof (obj.data as { available?: unknown }).available === "boolean"
    ) {
      return {
        available: (obj.data as { available: boolean }).available,
        slug: trimmed,
      }
    }
    if (typeof obj.available === "boolean") {
      return { available: obj.available, slug: trimmed }
    }
  }
  // Unknown shape — assume taken to err on the safe side.
  return { available: false, slug: trimmed }
}

export const checkStoreSlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: storeKeys.slugAvailability(slug),
    queryFn: () => checkStoreSlug(slug),
    staleTime: 30_000,
  })

export const createStore = async (
  input: CreateStoreInput
): Promise<StoreRegistrationResponse> => {
  const response = await api<Envelope<StoreRegistrationResponse>>("/auth/stores", {
    method: "POST",
    body: input,
  })
  if (!response.data) {
    throw new Error("Empty create-store response")
  }
  return response.data
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

export const getCreateStoreMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (response: StoreRegistrationResponse, didRotateAuth: boolean) => void
}) => ({
  mutationFn: createStore,
  onSuccess: async (response: StoreRegistrationResponse) => {
    let didRotate = false

    if (response.auth) {
      const slug =
        response.auth.tenantSlug ?? response.store.slug ?? null
      const isStillHub = slug === REGISTRATION_HUB_SLUG ? null : slug

      await setSessionTokens({
        accessToken: response.auth.accessToken,
        refreshToken: response.auth.refreshToken,
        tenantSlug: isStillHub,
      })
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser })
      didRotate = true
    }

    queryClient.invalidateQueries({ queryKey: storeKeys.all })
    onSuccess?.(response, didRotate)
  },
})

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
