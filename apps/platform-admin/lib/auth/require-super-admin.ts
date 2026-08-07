import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import cookiesConfig from "@/config/cookies-config"
import { hasPlatformAdminRole } from "@/lib/auth/jwt"

export async function requireSuperAdmin(redirectTo = "/login") {
  const store = await cookies()
  const accessToken = store.get(cookiesConfig.accessToken)?.value
  const refreshToken = store.get(cookiesConfig.refreshToken)?.value

  if (!accessToken && !refreshToken) {
    redirect(redirectTo)
  }

  if (accessToken && !hasPlatformAdminRole(accessToken)) {
    redirect(redirectTo)
  }

  return { accessToken, refreshToken }
}
