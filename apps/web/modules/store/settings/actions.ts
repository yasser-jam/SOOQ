import type { QueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
  StoreDeletionRequestDto,
  StoreSettingsResponseDto,
  UpdateStoreSettingsInput,
} from "./types"

export const settingsKeys = {
  all: ["store", "settings"] as const,
  settings: ["store", "settings", "current"] as const,
  slugAvailability: (slug: string) =>
    ["store", "settings", "slug-availability", slug] as const,
}

const SETTINGS_PATH = "/admin/store/settings"

export const getStoreSettings = async (): Promise<StoreSettingsResponseDto> => {
  const response = await api<ApiResponse<StoreSettingsResponseDto>>(SETTINGS_PATH)
  if (!response.data) {
    throw new Error("Empty store-settings response")
  }
  return response.data
}

export const getStoreSettingsQueryOptions = () =>
  queryOptions({
    queryKey: settingsKeys.settings,
    queryFn: getStoreSettings,
    staleTime: 30_000,
  })

export type SlugAvailability = {
  available: boolean
  slug: string
}

/**
 * Slug availability check for the authenticated merchant — used by both
 * the onboarding wizard's slug step and the settings Identity tab.
 * Backend returns `{success, data: boolean}` per STR.md but older
 * builds returned a raw boolean or `{available: boolean}` — normalise
 * defensively so callers don't have to care.
 */
export const checkStoreSlug = async (
  slug: string
): Promise<SlugAvailability> => {
  const trimmed = slug.trim()
  const response = await api<unknown>(
    `${SETTINGS_PATH}/check-slug?slug=${encodeURIComponent(trimmed)}`
  )

  if (typeof response === "boolean") {
    return { available: response, slug: trimmed }
  }
  if (response && typeof response === "object") {
    const obj = response as { data?: unknown; available?: unknown }
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
  return { available: false, slug: trimmed }
}

export const checkStoreSlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: settingsKeys.slugAvailability(slug),
    queryFn: () => checkStoreSlug(slug),
    staleTime: 15_000,
  })

export const updateStoreSettings = async (
  input: UpdateStoreSettingsInput
): Promise<StoreSettingsResponseDto> => {
  const response = await api<ApiResponse<StoreSettingsResponseDto>>(SETTINGS_PATH, {
    method: "PUT",
    body: input,
  })
  if (!response.data) {
    throw new Error("Empty update-settings response")
  }
  return response.data
}

export const requestStoreDeletion = async (
  input: StoreDeletionRequestDto
): Promise<StoreSettingsResponseDto> => {
  const response = await api<ApiResponse<StoreSettingsResponseDto>>(
    `${SETTINGS_PATH}/deletion/request`,
    { method: "POST", body: input }
  )
  if (!response.data) {
    throw new Error("Empty deletion-request response")
  }
  return response.data
}

export const cancelStoreDeletion = async (): Promise<StoreSettingsResponseDto> => {
  const response = await api<ApiResponse<StoreSettingsResponseDto>>(
    `${SETTINGS_PATH}/deletion/cancel`,
    { method: "POST" }
  )
  if (!response.data) {
    throw new Error("Empty deletion-cancel response")
  }
  return response.data
}

export const getUpdateStoreSettingsMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (settings: StoreSettingsResponseDto) => void
}) => ({
  mutationFn: updateStoreSettings,
  onSuccess: (settings: StoreSettingsResponseDto) => {
    queryClient.setQueryData(settingsKeys.settings, settings)
    onSuccess?.(settings)
  },
})

export const getRequestStoreDeletionMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (settings: StoreSettingsResponseDto) => void
}) => ({
  mutationFn: requestStoreDeletion,
  onSuccess: (settings: StoreSettingsResponseDto) => {
    queryClient.setQueryData(settingsKeys.settings, settings)
    onSuccess?.(settings)
  },
})

export const getCancelStoreDeletionMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (settings: StoreSettingsResponseDto) => void
}) => ({
  mutationFn: cancelStoreDeletion,
  onSuccess: (settings: StoreSettingsResponseDto) => {
    queryClient.setQueryData(settingsKeys.settings, settings)
    onSuccess?.(settings)
  },
})
