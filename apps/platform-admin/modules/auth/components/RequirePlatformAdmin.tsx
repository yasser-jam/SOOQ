"use client"

import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { toast } from "sonner"

import cookiesConfig from "@/config/cookies-config"
import { clearSession } from "@/lib/auth/internal"
import { removeCookie } from "@/lib/cookies"

import { useCurrentUser } from "../hooks/useCurrentUser"

type RequirePlatformAdminProps = {
  children: ReactNode
  loading?: ReactNode
}

export function RequirePlatformAdmin({
  children,
  loading,
}: RequirePlatformAdminProps) {
  const router = useRouter()
  const { isLoading, hasRole, isAuthenticated } = useCurrentUser()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !hasRole("PLATFORM_ADMIN")) {
      toast.error("ليست لديك صلاحيات دخول لوحة المنصة")
      removeCookie(cookiesConfig.accessToken)
      removeCookie(cookiesConfig.userName)
      void clearSession()
      router.replace("/login")
    }
  }, [isLoading, isAuthenticated, hasRole, router])

  if (isLoading) {
    return <>{loading ?? null}</>
  }

  if (!isAuthenticated || !hasRole("PLATFORM_ADMIN")) {
    return null
  }

  return <>{children}</>
}
