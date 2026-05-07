import type { QueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"

import cookiesConfig from "@/config/cookies-config"
import { api } from "@/lib/api"
import { decodeJwt } from "@/lib/auth/jwt"
import { setSessionTokens } from "@/lib/auth/internal"
import { getCookie } from "@/lib/cookies"

import type {
  AuthTokenResponse,
  CurrentUser,
  GoogleOAuthInput,
  RequestOtpInput,
  Role,
  VerifyOtpInput,
} from "./types"
import { REGISTRATION_HUB_SLUG } from "./types"

export const authKeys = {
  all: ["auth"] as const,
  currentUser: ["auth", "current-user"] as const,
}

type Envelope<T> = {
  success: boolean
  data?: T
  message?: string
}

export const requestOtp = async (input: RequestOtpInput): Promise<string> => {
  const response = await api<Envelope<string>>("/auth/otp/request", {
    method: "POST",
    body: input,
  })
  return response.data ?? ""
}

export const verifyOtp = async (
  input: VerifyOtpInput
): Promise<AuthTokenResponse> => {
  const response = await api<Envelope<AuthTokenResponse>>("/auth/otp/verify", {
    method: "POST",
    body: input,
  })
  if (!response.data) {
    throw new Error("Empty verify-otp response")
  }
  return response.data
}

export const loginWithGoogle = async (
  input: GoogleOAuthInput
): Promise<AuthTokenResponse> => {
  const response = await api<Envelope<AuthTokenResponse>>("/auth/oauth/google", {
    method: "POST",
    body: input,
  })
  if (!response.data) {
    throw new Error("Empty google-oauth response")
  }
  return response.data
}

const readCurrentUser = (): CurrentUser | null => {
  const token = getCookie(cookiesConfig.accessToken)
  const payload = decodeJwt(token)
  if (!payload) return null

  const tenantSlug =
    getCookie(cookiesConfig.tenantSlug) ??
    (typeof payload.tenantSlug === "string" ? payload.tenantSlug : null)

  return {
    userId: payload.sub ?? "",
    username:
      typeof payload["username"] === "string"
        ? (payload["username"] as string)
        : "",
    tenantId:
      typeof payload.tenantId === "string"
        ? payload.tenantId
        : typeof payload["tid"] === "string"
          ? (payload["tid"] as string)
          : "",
    tenantSlug,
    jti: payload.jti,
    roles: (payload.roles ?? []) as Role[],
    permissions: payload.permissions ?? [],
    expiresAtSec: payload.exp,
  }
}

export const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.currentUser,
    queryFn: () => readCurrentUser(),
    staleTime: Infinity,
  })

export const isHubTenant = (user: CurrentUser | null): boolean => {
  if (!user) return false
  return user.tenantSlug === REGISTRATION_HUB_SLUG
}

const persistAuthResponse = async (
  response: AuthTokenResponse
): Promise<void> => {
  await setSessionTokens({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    tenantSlug: response.tenantSlug ?? null,
  })
}

export const getRequestOtpMutationOptions = () => ({
  mutationFn: requestOtp,
})

export const getVerifyOtpMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (response: AuthTokenResponse, isHub: boolean) => void
}) => ({
  mutationFn: verifyOtp,
  onSuccess: async (response: AuthTokenResponse) => {
    await persistAuthResponse(response)
    queryClient.invalidateQueries({ queryKey: authKeys.currentUser })
    const isHub = response.tenantSlug === REGISTRATION_HUB_SLUG
    onSuccess?.(response, isHub)
  },
})

export const getGoogleOAuthMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (response: AuthTokenResponse, isHub: boolean) => void
}) => ({
  mutationFn: loginWithGoogle,
  onSuccess: async (response: AuthTokenResponse) => {
    await persistAuthResponse(response)
    queryClient.invalidateQueries({ queryKey: authKeys.currentUser })
    const isHub = response.tenantSlug === REGISTRATION_HUB_SLUG
    onSuccess?.(response, isHub)
  },
})
