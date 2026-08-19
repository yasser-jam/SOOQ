const cookiesConfig = {
  /** Merchant / platform dashboard session (apps/web admin). */
  adminAccessToken: "sooq-admin-access-token",
  /** Storefront customer session (OTP login on the published store). */
  storeAccessToken: "sooq-store-access-token",
  refreshToken: "sooq-refresh-token",
  tenantSlug: "sooq-tenant-slug",
  tenantId: "sooq-tenant-id",
  /** Store's primary currency (e.g. SYP), resolved alongside tenantId/slug. */
  primaryCurrency: "sooq-primary-currency",
  userName: "sooq-user-name",
} as const

export type CookieName =
  (typeof cookiesConfig)[keyof typeof cookiesConfig]

export type ServerCookieOptions = {
  path: string
  sameSite: "lax"
  secure: boolean
  httpOnly: boolean
  maxAge?: number
}

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export const serverCookieOptions = (
  name: CookieName,
  maxAge: number = ONE_YEAR_SECONDS
): ServerCookieOptions => ({
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: name === cookiesConfig.refreshToken,
  maxAge,
})

export default cookiesConfig
