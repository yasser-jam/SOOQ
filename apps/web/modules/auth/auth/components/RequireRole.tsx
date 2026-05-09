"use client"

import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { useCurrentUser } from "../hooks/useCurrentUser"
import type { Role } from "../types"

type RequireRoleProps = {
  roles: Role[]
  children: ReactNode
  fallback?: ReactNode
  loading?: ReactNode
}

export default function RequireRole({
  roles,
  children,
  fallback,
  loading,
}: RequireRoleProps) {
  const { isLoading, hasRole, isAuthenticated } = useCurrentUser()

  if (isLoading) {
    return <>{loading ?? null}</>
  }

  if (!isAuthenticated || !hasRole(roles)) {
    if (fallback !== undefined) {
      return <>{fallback}</>
    }
    notFound()
  }

  return <>{children}</>
}
