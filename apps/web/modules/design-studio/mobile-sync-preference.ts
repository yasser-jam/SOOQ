import type { DesignConfigJson } from "./types"

/**
 * Web→mobile sync preference ("تطبيق تغييرات الويب على الجوال تلقائياً").
 *
 * The durable copy lives inside the draft's `configJson.mobileSyncEnabled`
 * (carried on every save). This localStorage mirror makes the toggle readable
 * synchronously in the editor UI and lets a flip take effect on the next save
 * even before any round-trip; hydration re-syncs the mirror from the server.
 */
const MOBILE_SYNC_PREFERENCE_KEY = "sooq-design:mobile-sync-enabled"

const isBrowser = typeof window !== "undefined"

/** `null` = the merchant never touched the toggle in this browser. */
export const readLocalMobileSyncPreference = (): boolean | null => {
  if (!isBrowser) return null
  const raw = window.localStorage.getItem(MOBILE_SYNC_PREFERENCE_KEY)
  if (raw === "1") return true
  if (raw === "0") return false
  return null
}

export const writeLocalMobileSyncPreference = (enabled: boolean): void => {
  if (!isBrowser) return
  window.localStorage.setItem(MOBILE_SYNC_PREFERENCE_KEY, enabled ? "1" : "0")
}

/**
 * Effective toggle value: local mirror → server config → default `true`
 * (historic behavior: mobile follows web until the merchant opts out).
 */
export const resolveMobileSyncEnabled = (
  config?: Pick<DesignConfigJson, "mobileSyncEnabled"> | null
): boolean => {
  const local = readLocalMobileSyncPreference()
  if (local !== null) return local
  if (typeof config?.mobileSyncEnabled === "boolean") {
    return config.mobileSyncEnabled
  }
  return true
}
