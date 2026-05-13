"use client"

import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"

import { getStoreSettingsQueryOptions } from "@/modules/store/settings/actions"

const ONBOARDING_PATH = "/onboarding/create-store"

/**
 * Onboarding gate for the merchant dashboard. After OTP verify the user
 * lands on a temporary `tmp-…` tenant; `GET /admin/store/settings`
 * exposes `isConfigured` (mirrors `tenant.configured`). When `false`,
 * we redirect to the create-store wizard so the merchant cannot reach
 * dashboard pages until they pick a public slug / name / currency
 * (AUTH.md §F).
 *
 * Errors from the settings endpoint are not swallowed silently: the
 * shared axios interceptor surfaces 401 via the refresh flow, and
 * everything else falls through and renders the dashboard so we don't
 * brick the UI on a transient failure.
 */
export default function StoreConfigurationGate({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: settings, isLoading } = useQuery({
    ...getStoreSettingsQueryOptions(),
    retry: false,
  })

  const needsOnboarding =
    settings != null && !settings.isConfigured && pathname !== ONBOARDING_PATH

  React.useEffect(() => {
    if (needsOnboarding) {
      router.replace(ONBOARDING_PATH)
    }
  }, [needsOnboarding, router])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  if (needsOnboarding) {
    return null
  }

  return <>{children}</>
}
