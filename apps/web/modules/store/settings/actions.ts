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
