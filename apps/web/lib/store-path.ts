"use client"

/**
 * Path helper for merchant dashboard links.
 * Dashboard URLs are slugless — tenant slug lives in localStorage / headers.
 */
export function useStorePath() {
  return (path: string) => {
    if (!path || path === "/") return "/"
    return path.startsWith("/") ? path : `/${path}`
  }
}
