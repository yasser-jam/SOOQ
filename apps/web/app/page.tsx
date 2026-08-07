import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { LandingPage } from "@/components/landing/landing-page"
import cookiesConfig from "@/config/cookies-config"
import { decodeJwtPayload } from "@/lib/jwt"
import { REGISTRATION_HUB_SLUG } from "@/modules/auth/auth/types"

/**
 * Root entry point.
 *
 * - **No / malformed session** → render the marketing landing page. Its CTAs
 *   point at `/request-otp` for the actual signup flow.
 * - **Token without OWNER** (or still on the registration hub) →
 *   `/onboarding/create-store` so they can become an owner.
 * - **Token + OWNER + real tenant slug** → `/store/${slug}` (merchant dashboard).
 *
 * Server-side decoding (instead of letting the client mount and bounce) keeps
 * the authenticated experience flash-free — the visitor never sees the
 * landing for an instant on their way to the dashboard.
 */
export default async function RootPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(cookiesConfig.adminAccessToken)?.value
  const payload = accessToken ? decodeJwtPayload(accessToken) : null

  if (!accessToken || !payload) {
    return <LandingPage />
  }

  const roles = Array.isArray(payload.roles)
    ? payload.roles.filter((role): role is string => typeof role === "string")
    : []
  const slugFromCookie = cookieStore.get(cookiesConfig.tenantSlug)?.value || null
  const slugFromJwt =
    typeof payload.tenantSlug === "string" ? (payload.tenantSlug as string) : null
  const tenantSlug = slugFromCookie ?? slugFromJwt

  if (!roles.includes("OWNER") || !tenantSlug || tenantSlug === REGISTRATION_HUB_SLUG) {
    redirect("/onboarding/create-store")
  }

  redirect(`/store/${encodeURIComponent(tenantSlug)}`)
}
