/**
 * Post-login / post-onboarding redirect for the merchant dashboard.
 *
 * Merchant admin is slugless at `/` — tenant identity lives in localStorage
 * (`sooq-tenant-slug`) and the `X-Tenant-Slug` request header, not the URL.
 *
 * - Returns `null` when the slug is empty or the registration-hub sentinel —
 *   callers should treat that as "stay on onboarding / do not navigate home".
 * - Otherwise returns `"/"` (dashboard root).
 *
 * `NEXT_PUBLIC_STOREFRONT_BASE` is ignored for merchant redirects (legacy).
 */
import { REGISTRATION_HUB_SLUG } from "@/modules/auth/auth/types"

export const buildStorefrontUrl = (
  slug: string | null | undefined
): string | null => {
  if (!slug) return null
  if (slug === REGISTRATION_HUB_SLUG) return null
  return "/"
}
