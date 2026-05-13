import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"

import type { StoreSettings } from "./types"

export const storeSettingsKeys = {
  all: ["store-settings"] as const,
  current: ["store-settings", "current"] as const,
}

type Envelope<T> = {
  success: boolean
  data?: T
  message?: string
}

/**
 * Fetches the authenticated merchant's store settings.
 *
 * The backend creates a bare `store_config` row on first access if none
 * exists, so this is safe to call right after OTP verify on a freshly
 * provisioned tenant. The `isConfigured` flag mirrors `tenant.configured`
 * and drives the onboarding gate — when `false`, the dashboard layout
 * redirects to the create-store wizard.
 */
export const getStoreSettings = async (): Promise<StoreSettings> => {
  const response = await api<Envelope<StoreSettings>>("/admin/store/settings")
  if (!response.data) {
    throw new Error("Empty store-settings response")
  }
  return response.data
}

export const storeSettingsQueryOptions = () =>
  queryOptions({
    queryKey: storeSettingsKeys.current,
    queryFn: getStoreSettings,
    staleTime: 30_000,
  })
