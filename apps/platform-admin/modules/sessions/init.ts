import type { AuthSession } from "./types"

export const isCurrentSession = (
  session: AuthSession,
  currentJti: string | null | undefined
): boolean => Boolean(currentJti && session.jwtJti === currentJti)

export const sortSessionsByRecency = (sessions: AuthSession[]): AuthSession[] =>
  [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
