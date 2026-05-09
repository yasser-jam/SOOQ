"use client"

import { useQuery } from "@tanstack/react-query"

import { currentUserQueryOptions, isHubTenant } from "../actions"
import type { Permission, Role } from "../types"

export const useCurrentUser = () => {
  const { data: user, isLoading, isFetching } = useQuery(currentUserQueryOptions())

  const hasRole = (role: Role | Role[]): boolean => {
    if (!user) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.some((r) => user.roles.includes(r))
  }

  const hasPermission = (permission: Permission | Permission[]): boolean => {
    if (!user) return false
    const perms = Array.isArray(permission) ? permission : [permission]
    return perms.some((p) => user.permissions.includes(p))
  }

  return {
    user: user ?? null,
    isAuthenticated: Boolean(user),
    isHub: isHubTenant(user ?? null),
    isLoading,
    isFetching,
    hasRole,
    hasPermission,
  }
}
