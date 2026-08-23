"use client"

import { useQuery } from "@tanstack/react-query"

import { currentUserQueryOptions } from "../actions"
import type { Role } from "../types"

export const useCurrentUser = () => {
  const { data: user, isLoading, isFetching } = useQuery(currentUserQueryOptions())

  const hasRole = (role: Role | Role[]): boolean => {
    if (!user) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.some((r) => user.roles.includes(r))
  }

  return {
    user: user ?? null,
    isAuthenticated: Boolean(user),
    isLoading,
    isFetching,
    hasRole,
  }
}
