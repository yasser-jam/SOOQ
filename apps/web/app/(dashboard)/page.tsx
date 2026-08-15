"use client"

import { HomeMockDashboard } from "@/components/home-mock-dashboard"
import { FullPageLoader } from "@/components/full-page-loader"
import { SeedFurnitureButton } from "@/modules/product/seed/seed-furniture-button"
import { SeedProductsButton } from "@/modules/product/seed/seed-products-button"
import { getStoreSettingsQueryOptions } from "@/modules/store/settings/actions"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useToastManager } from "@base-ui/react";
import { toast } from "sonner";

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

      <div className="container space-y-6 py-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <SeedProductsButton />
          <SeedFurnitureButton />
        </div>
        <HomeMockDashboard />
      </div>
    </>
  )
}
