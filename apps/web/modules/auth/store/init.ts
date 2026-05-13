import type {
  SaveStoreSettingsInput,
  UpdateStoreRateLimitInput,
  UpdateStoreStatusInput,
} from "./types"

export const saveStoreSettingsDefaultValues: SaveStoreSettingsInput = {
  storeName: "",
  slug: "",
  primaryCurrencyCode: "SYP",
}

export const slugifyStoreName = (name: string): string =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export const initSaveStoreSettingsPayload = (
  input: SaveStoreSettingsInput
): SaveStoreSettingsInput => ({
  storeName: input.storeName.trim(),
  slug: input.slug.trim().toLowerCase(),
  primaryCurrencyCode: input.primaryCurrencyCode.trim().toUpperCase(),
})

export const updateStoreStatusDefaultValues: UpdateStoreStatusInput = {
  status: "ACTIVE",
  maintenanceMessage: "",
  storePassword: "",
}

export const updateStoreRateLimitDefaultValues: UpdateStoreRateLimitInput = {
  requestsPerMinute: 60,
}
