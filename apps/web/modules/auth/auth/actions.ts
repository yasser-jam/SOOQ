import type { QueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"

import cookiesConfig from "@/config/cookies-config"
import { api } from "@/lib/api"
import { decodeJwt } from "@/lib/auth/jwt"
import { setSessionTokens } from "@/lib/auth/internal"
import { getCookie } from "@/lib/cookies"
import { formatStoredPhoneForDisplay } from "@/lib/schema"

import type {
  AuthTokenResponse,
  CurrentUser,
  GoogleOAuthInput,
  RequestOtpCommand,
  Role,
  VerifyOtpCommand,
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

export const requestOtp = async (
  command: RequestOtpCommand
): Promise<string> => {
  const { tenantSlug, ...body } = command
  const response = await api<Envelope<string>>("/auth/otp/request", {
    method: "POST",
    body,
    headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : undefined,
  })
  return response.data ?? ""
}

export const verifyOtp = async (
  command: VerifyOtpCommand
): Promise<AuthTokenResponse> => {
  const { tenantSlug, ...body } = command
  const response = await api<Envelope<AuthTokenResponse>>("/auth/otp/verify", {
    method: "POST",
    body,
    headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : undefined,
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
  const token = getCookie(cookiesConfig.adminAccessToken)
  const payload = decodeJwt(token)
  if (!payload) return null

  const readString = (key: string): string | null => {
    const value = payload[key]
    return typeof value === "string" && value.length > 0 ? value : null
  }

  const tenantSlug =
    getCookie(cookiesConfig.tenantSlug) ?? readString("tenantSlug")

  // Backend JWT layout (see JwtSecurityProvider#issueAuthentication):
  //   sub      = user UUID  (OIDC-aligned stable identifier)
  //   userId   = user UUID  (duplicate for legacy readers)
  //   username = primary login channel — phone for OTP, email for OAuth
  //   phone    = phone digits or omitted/null
  //   email    = lowercase email or omitted/null
  //   tenantId = tenant UUID
  //   tenantSlug = tenant slug (optional)
  const userId = readString("userId") ?? readString("sub") ?? ""
  const username = readString("username") ?? ""
  const phoneClaim = readString("phone")
  const emailClaim = readString("email")

  return {
    userId,
    username: phoneClaim
      ? formatStoredPhoneForDisplay(phoneClaim)
      : (emailClaim ?? username),
    // Phone is stored digit-only by the backend (PhoneNumbers.toStoredDigits).
    // Re-attach the `+` here so form prefill renders as E.164.
    phone: phoneClaim ? formatStoredPhoneForDisplay(phoneClaim) : null,
    email: emailClaim,
    tenantId: readString("tenantId") ?? readString("tid") ?? "",
    tenantSlug,
    jti: payload.jti,
    roles: (payload.roles ?? []) as Role[],
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
