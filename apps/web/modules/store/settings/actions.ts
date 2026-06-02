import type { QueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"
import { devAuthEnabled } from "@/modules/auth/auth/init"

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
const DEV_STORE_SETTINGS_KEY = "sooq-dev-store-settings"

const readDevStoreSettings = (): StoreSettingsResponseDto | null => {
  if (!devAuthEnabled || typeof window === "undefined") return null
  const raw = window.localStorage.getItem(DEV_STORE_SETTINGS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoreSettingsResponseDto
  } catch {
    return null
  }
}

const writeDevStoreSettings = (
  settings: StoreSettingsResponseDto
): StoreSettingsResponseDto => {
  if (devAuthEnabled && typeof window !== "undefined") {
    window.localStorage.setItem(DEV_STORE_SETTINGS_KEY, JSON.stringify(settings))
  }
  return settings
}

const makeDevStoreSettings = (
  input: UpdateStoreSettingsInput = {}
): StoreSettingsResponseDto => ({
  storeConfigId: "dev-store-config",
  tenantId: "dev-registration-tenant",
  storeName: input.storeName ?? "متجر SOOQ التجريبي",
  slug: input.slug ?? "sooq-store",
  primaryCurrencyCode: input.primaryCurrencyCode ?? "SYP",
  isConfigured: Boolean(input.storeName && input.slug && input.primaryCurrencyCode),
  profileNameAr: input.profileNameAr ?? "",
  profileNameEn: input.profileNameEn ?? "",
  profileDescription: input.profileDescription ?? "",
  contactEmail: input.contactEmail ?? "",
  contactPhone: input.contactPhone ?? "",
  governorate: input.governorate ?? "",
  city: input.city ?? "",
  street: input.street ?? "",
  latitude: input.latitude ?? null,
  longitude: input.longitude ?? null,
  logoUrl: input.logoUrl ?? "",
  faviconUrl: input.faviconUrl ?? "",
  currencySymbolPosition: input.currencySymbolPosition ?? "AFTER",
  currencyDecimalPlaces: input.currencyDecimalPlaces ?? 0,
  numeralSystem: input.numeralSystem ?? "LATIN",
  timezone: input.timezone ?? "Asia/Damascus",
  socialLinks: input.socialLinks ?? [],
  businessHours: input.businessHours ?? [],
  deletionRequested: false,
})

export const getStoreSettings = async (): Promise<StoreSettingsResponseDto> => {
  if (devAuthEnabled) {
    return readDevStoreSettings() ?? makeDevStoreSettings()
  }

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
  if (devAuthEnabled) {
    const currentSlug = readDevStoreSettings()?.slug
    return { available: !currentSlug || currentSlug === trimmed, slug: trimmed }
  }

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
  if (devAuthEnabled) {
    const nextSettings = {
      ...makeDevStoreSettings(input),
      ...readDevStoreSettings(),
      ...input,
    }
    return writeDevStoreSettings({
      ...nextSettings,
      isConfigured: Boolean(
        nextSettings.storeName &&
          nextSettings.slug &&
          nextSettings.primaryCurrencyCode
      ),
    })
  }

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
