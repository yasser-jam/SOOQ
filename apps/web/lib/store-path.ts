"use client"

import { useParams } from "next/navigation"

export function useStorePath() {
  const params = useParams<{ storeSlug: string }>()
  const storeSlug = params?.storeSlug ?? ""

  return (path: string) => {
    const normalized = path.startsWith("/") ? path : `/${path}`
    return `/store/${storeSlug}${normalized}`
  }
}
