import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import cookiesConfig from "@/config/cookies-config"
import { hasPlatformAdminRole } from "@/lib/auth/jwt"

export default async function HomePage() {
  const store = await cookies()
  const accessToken = store.get(cookiesConfig.accessToken)?.value
  const refreshToken = store.get(cookiesConfig.refreshToken)?.value

  if ((accessToken || refreshToken) && hasPlatformAdminRole(accessToken)) {
    redirect("/dashboard")
  }

  redirect("/login")
}
