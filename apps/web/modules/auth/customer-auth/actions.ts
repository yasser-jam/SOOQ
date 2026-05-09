import type { QueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { setSessionTokens } from "@/lib/auth/internal"
import { authKeys } from "@/modules/auth/auth/actions"
import type { AuthTokenResponse } from "@/modules/auth/auth/types"

import type {
  RequestCustomerOtpInput,
  VerifyCustomerOtpInput,
} from "./types"

type Envelope<T> = {
  success: boolean
  data?: T
  message?: string
}

export const requestCustomerOtp = async (
  input: RequestCustomerOtpInput
): Promise<string> => {
  const response = await api<Envelope<string>>("/customer/auth/otp/request", {
    method: "POST",
    body: input,
  })
  return response.data ?? ""
}

export const verifyCustomerOtp = async (
  input: VerifyCustomerOtpInput
): Promise<AuthTokenResponse> => {
  const response = await api<Envelope<AuthTokenResponse>>(
    "/customer/auth/otp/verify",
    { method: "POST", body: input }
  )
  if (!response.data) {
    throw new Error("Empty customer-otp-verify response")
  }
  return response.data
}

export const getRequestCustomerOtpMutationOptions = () => ({
  mutationFn: requestCustomerOtp,
})

export const getVerifyCustomerOtpMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (response: AuthTokenResponse) => void
}) => ({
  mutationFn: verifyCustomerOtp,
  onSuccess: async (
    response: AuthTokenResponse,
    variables: VerifyCustomerOtpInput
  ) => {
    // Backend customer-auth response doesn't always echo tenantSlug;
    // fall back to the slug we sent so the cookie is correct.
    const resolvedSlug = response.tenantSlug ?? variables.tenantSlug ?? null
    await setSessionTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      tenantSlug: resolvedSlug,
    })
    queryClient.invalidateQueries({ queryKey: authKeys.currentUser })
    onSuccess?.(response)
  },
})
