"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"

import cookiesConfig from "@/config/cookies-config"
import { logoutSession } from "@/lib/auth/internal"
import { removeCookie } from "@/lib/cookies"

import { authKeys } from "../actions"

export const useLogout = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isPending, setPending] = useState(false)

  const logout = async () => {
    setPending(true)
    try {
      await logoutSession().catch(() => undefined)
    } finally {
      removeCookie(cookiesConfig.adminAccessToken)
      removeCookie(cookiesConfig.tenantSlug)
      queryClient.removeQueries({ queryKey: authKeys.currentUser })
      queryClient.clear()
      router.push("/request-otp")
      setPending(false)
    }
  }

  return { logout, isPending }
}
