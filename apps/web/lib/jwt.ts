// Minimal JWT helpers — payload extraction only, no signature verification.
// We never trust JWT contents for authorization decisions on the client; the
// backend re-validates every request. We only use the decoded payload to read
// claims that the FE already knows are present (tenantId for admin sessions).

interface JwtPayload {
  tenantId?: string
  sub?: string
  exp?: number
  iat?: number
  [claim: string]: unknown
}

const base64UrlDecode = (segment: string): string => {
  // JWT uses base64url (- and _) without padding; pad to multiple of 4 and
  // swap chars before atob() can handle it.
  const padded = segment.padEnd(
    segment.length + ((4 - (segment.length % 4)) % 4),
    "="
  )
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/")

  if (typeof atob === "function") {
    return atob(base64)
  }

  // Fallback for SSR environments — Buffer is available in Node.
  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64, "base64").toString("binary")
  }

  return ""
}

export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const json = base64UrlDecode(parts[1] ?? "")
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export const getTenantIdFromToken = (token: string): string | null => {
  const payload = decodeJwtPayload(token)
  return payload?.tenantId ?? null
}
