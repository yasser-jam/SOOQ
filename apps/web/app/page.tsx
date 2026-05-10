import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import cookiesConfig from "@/config/cookies-config"
import { decodeJwtPayload } from "@/lib/jwt"
import { REGISTRATION_HUB_SLUG } from "@/modules/auth/auth/types"

/**
 * Root entry point. Before the multi-tenant routing refactor the dashboard
 * itself lived at `/`; after it moved to `/store/[slug]`, hitting `/` with
 * a valid session leaves Next.js with no page to render and the user sees a
 * 404. Resolve that here: pick the right destination from the JWT and
 * server-redirect there so there's never a visible 404.
 *
 * - No access token → `/request-otp`
 * - Token + real tenant slug → `/store/${slug}` (merchant dashboard)
 * - Token but still on the registration hub → `/onboarding/create-store`
 */
export default async function RootPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(cookiesConfig.accessToken)?.value

  if (!accessToken) {
    redirect("/request-otp")
  }

  const payload = decodeJwtPayload(accessToken)
  if (!payload) {
    // Token cookie exists but is malformed — treat as unauthenticated.
    redirect("/request-otp")
  }

  const slugFromCookie = cookieStore.get(cookiesConfig.tenantSlug)?.value || null
  const slugFromJwt =
    typeof payload.tenantSlug === "string" ? (payload.tenantSlug as string) : null
  const tenantSlug = slugFromCookie ?? slugFromJwt

  if (tenantSlug && tenantSlug !== REGISTRATION_HUB_SLUG) {
    redirect(`/store/${encodeURIComponent(tenantSlug)}`)
  }

  redirect("/onboarding/create-store")
}
