export type JwtPayload = {
  sub?: string
  jti?: string
  exp?: number
  iat?: number
  roles?: string[]
  tenantId?: string
  [key: string]: unknown
}

const base64UrlDecode = (input: string): string => {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/")
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4))

  if (typeof atob === "function") {
    return decodeURIComponent(
      atob(base64 + pad)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    )
  }

  // Node fallback (route handlers)
  return Buffer.from(base64 + pad, "base64").toString("utf8")
}

export const decodeJwt = (token: string | null | undefined): JwtPayload | null => {
  if (!token) return null
  const segments = token.split(".")
  if (segments.length < 2) return null

  try {
    const json = base64UrlDecode(segments[1] ?? "")
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export const isExpired = (
  token: string | null | undefined,
  skewSeconds: number = 30
): boolean => {
  const payload = decodeJwt(token)
  if (!payload?.exp) return true
  const nowSec = Math.floor(Date.now() / 1000)
  return payload.exp - skewSeconds <= nowSec
}
