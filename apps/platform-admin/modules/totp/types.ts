import type * as z from "zod"

import type { enableTotpSchema } from "./schema"

export type TotpSetupResponse = {
  secret: string
  backupCodes: string[]
}

export type EnableTotpInput = z.infer<typeof enableTotpSchema>

export const buildOtpAuthUri = ({
  secret,
  username,
  issuer = "SOOQ Platform",
}: {
  secret: string
  username: string
  issuer?: string
}): string => {
  const safeUser = encodeURIComponent(username || "user")
  const safeIssuer = encodeURIComponent(issuer)
  const safeSecret = encodeURIComponent(secret)
  return `otpauth://totp/${safeIssuer}:${safeUser}?secret=${safeSecret}&issuer=${safeIssuer}`
}
