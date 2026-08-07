const cookiesConfig = {
  accessToken: "pa_access",
  refreshToken: "pa_refresh",
  userName: "pa_user_name",
} as const

export type CookieName = (typeof cookiesConfig)[keyof typeof cookiesConfig]

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
