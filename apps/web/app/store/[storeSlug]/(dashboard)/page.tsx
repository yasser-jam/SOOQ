"use client"

import { HomeMockDashboard } from "@/components/home-mock-dashboard"
import { FullPageLoader } from "@/components/full-page-loader"
import { getStoreSettingsQueryOptions } from "@/modules/store/settings/actions"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { data: settings, isPending } = useQuery(getStoreSettingsQueryOptions())

  const [loading, setLoading] = useState(true)

  // stop loader after 2 seconds
  useEffect(() => {
    if (!isPending && settings) {
      const timeoutId = window.setTimeout(() => {
        setLoading(false)
      }, 2000)
      return () => window.clearTimeout(timeoutId)
    }
  }, [isPending, settings])

  return (
    <>
      <FullPageLoader active={isPending || loading} loopMessages={false} />

      <div className="container py-6">
        <HomeMockDashboard />
      </div>
    </>
  )
}
