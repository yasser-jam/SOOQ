/**
 * Build the post-login / post-onboarding redirect URL for the merchant
 * (i.e. their dashboard at `/store/[slug]`). The function name is legacy —
 * after the multi-tenant routing refactor, the customer-facing storefront
 * lives under `/shop/[slug]`, not `/store/[slug]`.
 *
 * `NEXT_PUBLIC_STOREFRONT_BASE` should point at the merchant dashboard root
 * (default: `http://localhost:3000/store`). Use a dedicated helper for the
 * customer storefront URL when one is added.
 *
 * - Returns `null` when `NEXT_PUBLIC_STOREFRONT_BASE` is unset OR the slug is
 *   empty / the registration-hub sentinel — caller should fall back to `/`.
 * - Otherwise returns `${BASE}/${slug}` ready for `window.location.href`.
 */
import { REGISTRATION_HUB_SLUG } from "@/modules/auth/auth/types"

export const buildStorefrontUrl = (slug: string | null | undefined): string | null => {
  if (!slug) return null
  if (slug === REGISTRATION_HUB_SLUG) return null
  const base = process.env.NEXT_PUBLIC_STOREFRONT_BASE
  if (!base) return null
  const trimmedBase = base.replace(/\/+$/, "")
  return `${trimmedBase}/${encodeURIComponent(slug)}`
}
