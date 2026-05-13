import type {
  UpdateStoreRateLimitInput,
  UpdateStoreStatusInput,
} from "./types"

export const slugifyStoreName = (name: string): string =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export const updateStoreStatusDefaultValues: UpdateStoreStatusInput = {
  status: "ACTIVE",
  maintenanceMessage: "",
  storePassword: "",
}

export const updateStoreRateLimitDefaultValues: UpdateStoreRateLimitInput = {
  requestsPerMinute: 60,
}
