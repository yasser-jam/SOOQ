export type SessionTokensInput = {
  accessToken: string
  refreshToken: string
  tenantSlug?: string | null
}

export type RefreshResult = {
  accessToken: string
  expiresAt?: string
  tenantSlug?: string | null
}

const postJson = async <T = unknown>(
  url: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; data: T | null }> => {
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: body
      ? { "Content-Type": "application/json" }
      : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

  let data: T | null = null
  if (response.status !== 204) {
    try {
      data = (await response.json()) as T
    } catch {
      data = null
    }
  }

  return { ok: response.ok, status: response.status, data }
}

export const setSessionTokens = async (
  tokens: SessionTokensInput
): Promise<void> => {
  const { ok, status } = await postJson("/api/auth/session", tokens)
  if (!ok) {
    throw new Error(`setSessionTokens failed: ${status}`)
  }
}

export const refreshSession = async (): Promise<RefreshResult | null> => {
  const { ok, data } = await postJson<RefreshResult>("/api/auth/refresh")
  if (!ok || !data) return null
  return data
}

export const logoutSession = async (): Promise<void> => {
  await postJson("/api/auth/logout")
}
