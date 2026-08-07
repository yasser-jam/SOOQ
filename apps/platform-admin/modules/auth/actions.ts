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

export const authKeys = {
  all: ["auth"] as const,
  currentUser: ["auth", "current-user"] as const,
}

type Envelope<T> = {
  success: boolean
  data?: T
  message?: string
}

export const requestOtp = async (command: RequestOtpCommand): Promise<string> => {
  const response = await api<Envelope<string>>("/auth/otp/request", {
    method: "POST",
    body: command,
  })
  return response.data ?? ""
}

export const verifyOtp = async (
  command: VerifyOtpCommand
): Promise<AuthTokenResponse> => {
  const response = await api<Envelope<AuthTokenResponse>>("/auth/otp/verify", {
    method: "POST",
    body: command,
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

  const readString = (key: string): string | null => {
    const value = payload[key]
    return typeof value === "string" && value.length > 0 ? value : null
  }

  const userId = readString("userId") ?? readString("sub") ?? ""
  const username = readString("username") ?? ""
  const phoneClaim = readString("phone")
  const emailClaim = readString("email")

  return {
    userId,
    username: phoneClaim
      ? formatStoredPhoneForDisplay(phoneClaim)
      : (emailClaim ?? username),
    phone: phoneClaim ? formatStoredPhoneForDisplay(phoneClaim) : null,
    email: emailClaim,
    tenantId: readString("tenantId") ?? readString("tid") ?? "",
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

const persistAuthResponse = async (response: AuthTokenResponse): Promise<void> => {
  await setSessionTokens({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  })
}

export const PLATFORM_ADMIN_REQUIRED_ERROR =
  "ليست لديك صلاحيات دخول لوحة المنصة"

export const assertPlatformAdmin = (response: AuthTokenResponse): void => {
  if (!response.roles?.includes("PLATFORM_ADMIN")) {
    throw new Error(PLATFORM_ADMIN_REQUIRED_ERROR)
  }
}

export const getRequestOtpMutationOptions = () => ({
  mutationFn: requestOtp,
})

export const getVerifyOtpMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (response: AuthTokenResponse) => void
}) => ({
  mutationFn: async (command: VerifyOtpCommand) => {
    const response = await verifyOtp(command)
    assertPlatformAdmin(response)
    return response
  },
  onSuccess: async (response: AuthTokenResponse) => {
    await persistAuthResponse(response)
    queryClient.invalidateQueries({ queryKey: authKeys.currentUser })
    onSuccess?.(response)
  },
})

export const getGoogleOAuthMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (response: AuthTokenResponse) => void
}) => ({
  mutationFn: async (input: GoogleOAuthInput) => {
    const response = await loginWithGoogle(input)
    assertPlatformAdmin(response)
    return response
  },
  onSuccess: async (response: AuthTokenResponse) => {
    await persistAuthResponse(response)
    queryClient.invalidateQueries({ queryKey: authKeys.currentUser })
    onSuccess?.(response)
  },
})
