import cookiesConfig from "@/config/cookies-config"
import { getCookie } from "@/lib/cookies"
import { REGISTRATION_HUB_SLUG } from "@/modules/auth/auth/types"

/** Client-side tenant slug for merchant dashboard (mirrors cookie name). */
export const TENANT_SLUG_STORAGE_KEY = cookiesConfig.tenantSlug

const isUsableSlug = (slug: string | null | undefined): slug is string => {
  if (!slug) return false
  const trimmed = slug.trim()
  return trimmed.length > 0 && trimmed !== REGISTRATION_HUB_SLUG
}

export const setTenantSlug = (slug: string | null | undefined): void => {
  if (typeof window === "undefined") return
  if (!isUsableSlug(slug)) {
    window.localStorage.removeItem(TENANT_SLUG_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(TENANT_SLUG_STORAGE_KEY, slug.trim())
}

export const clearTenantSlug = (): void => {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(TENANT_SLUG_STORAGE_KEY)
}

/**
 * Prefer localStorage (set after OTP / onboarding); fall back to the
 * session cookie so a cleared LS still works until the next login.
 */
export const getTenantSlug = (): string | null => {
  if (typeof window === "undefined") return null

  try {
    const fromStorage = window.localStorage.getItem(TENANT_SLUG_STORAGE_KEY)
    if (isUsableSlug(fromStorage)) return fromStorage.trim()
  } catch {
    // private mode / blocked storage
  }

  const fromCookie = getCookie(cookiesConfig.tenantSlug)
  return isUsableSlug(fromCookie) ? fromCookie.trim() : null
}
