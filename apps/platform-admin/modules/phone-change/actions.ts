import type { QueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { authKeys } from "@/modules/auth/actions"
import { sessionKeys } from "@/modules/sessions/actions"

import type {
  RequestPhoneChangeInput,
  VerifyPhoneChangeInput,
} from "./types"

type Envelope<T> = {
  success: boolean
  data?: T
  message?: string
}

export const requestPhoneChange = async (
  input: RequestPhoneChangeInput
): Promise<void> => {
  await api<Envelope<unknown>>("/auth/phone/change/request", {
    method: "POST",
    body: input,
  })
}

export const verifyPhoneChange = async (
  input: VerifyPhoneChangeInput
): Promise<void> => {
  await api<Envelope<unknown>>("/auth/phone/change/verify", {
    method: "POST",
    body: input,
  })
}

export const getRequestPhoneChangeMutationOptions = () => ({
  mutationFn: requestPhoneChange,
})

export const getVerifyPhoneChangeMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: () => void
}) => ({
  mutationFn: verifyPhoneChange,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: sessionKeys.all })
    queryClient.invalidateQueries({ queryKey: authKeys.currentUser })
    onSuccess?.()
  },
})
