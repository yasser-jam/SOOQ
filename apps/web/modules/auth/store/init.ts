import type {
  CreateStoreInput,
  UpdateStoreRateLimitInput,
  UpdateStoreStatusInput,
} from "./types"

export const createStoreFormDefaultValues: CreateStoreInput = {
  storeName: "",
  slug: "",
  primaryCurrencyCode: "SYP",
  storeCategory: "GENERAL",
  themeCode: "DEFAULT",
  storeLogo: "",
}

export const slugifyStoreName = (name: string): string =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export const initCreateStorePayload = (
  input: CreateStoreInput
): CreateStoreInput => ({
  ...input,
  storeName: input.storeName.trim(),
  slug: input.slug.trim().toLowerCase(),
  themeCode: input.themeCode || "DEFAULT",
  storeLogo: input.storeLogo?.trim() || undefined,
})

export const updateStoreStatusDefaultValues: UpdateStoreStatusInput = {
  status: "ACTIVE",
  maintenanceMessage: "",
  storePassword: "",
}

export const updateStoreRateLimitDefaultValues: UpdateStoreRateLimitInput = {
  requestsPerMinute: 60,
}
