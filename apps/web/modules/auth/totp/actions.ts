import type { QueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"

import type { EnableTotpInput, TotpSetupResponse } from "./types"

export const totpKeys = {
  all: ["auth-totp"] as const,
}

type Envelope<T> = {
  success: boolean
  data?: T
  message?: string
}

export const setupTotp = async (): Promise<TotpSetupResponse> => {
  const response = await api<Envelope<TotpSetupResponse>>("/auth/totp/setup", {
    method: "POST",
  })
  if (!response.data) {
    throw new Error("Empty totp-setup response")
  }
  return response.data
}

export const enableTotp = async (input: EnableTotpInput): Promise<void> => {
  await api<Envelope<unknown>>("/auth/totp/enable", {
    method: "POST",
    body: input,
  })
}

export const disableTotp = async (): Promise<void> => {
  await api<Envelope<unknown>>("/auth/totp/disable", {
    method: "POST",
  })
}

export const getSetupTotpMutationOptions = () => ({
  mutationFn: setupTotp,
})

export const getEnableTotpMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: () => void
}) => ({
  mutationFn: enableTotp,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: totpKeys.all })
    onSuccess?.()
  },
})

export const getDisableTotpMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: () => void
}) => ({
  mutationFn: disableTotp,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: totpKeys.all })
    onSuccess?.()
  },
})
