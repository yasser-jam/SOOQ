import type { QueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"

import type { AuthSession } from "./types"

export const sessionKeys = {
  all: ["auth-sessions"] as const,
  detail: (jti: string) => [...sessionKeys.all, jti] as const,
}

type Envelope<T> = {
  success: boolean
  data?: T
  message?: string
}

export const listSessions = async (): Promise<AuthSession[]> => {
  const response = await api<Envelope<AuthSession[]>>("/auth/sessions")
  return response.data ?? []
}

export const listSessionsQueryOptions = () =>
  queryOptions({
    queryKey: sessionKeys.all,
    queryFn: listSessions,
  })

export const revokeSession = async (jti: string): Promise<{ jti: string }> => {
  await api<Envelope<unknown>>(`/auth/sessions/${jti}/revoke`, {
    method: "POST",
  })
  return { jti }
}

export const getRevokeSessionMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (jti: string) => void
}) => ({
  mutationFn: revokeSession,
  onSuccess: ({ jti }: { jti: string }) => {
    queryClient.invalidateQueries({ queryKey: sessionKeys.all })
    onSuccess?.(jti)
  },
})
