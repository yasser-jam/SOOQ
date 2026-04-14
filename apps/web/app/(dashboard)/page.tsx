"use client"

import { HomeMockDashboard } from "@/components/home-mock-dashboard"
import {
  FullPageLoader,
  SESSION_SHOW_STORE_SETUP_LOADER,
  STORE_SETUP_LOADER_FULL_CYCLE_MS,
} from "@/components/full-page-loader"
import * as React from "react"
import { toast } from "sonner"

export default function HomePage() {
  const [showPostSetupLoader, setShowPostSetupLoader] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    if (sessionStorage.getItem(SESSION_SHOW_STORE_SETUP_LOADER) !== "1") return
    sessionStorage.removeItem(SESSION_SHOW_STORE_SETUP_LOADER)
    setShowPostSetupLoader(true)
  }, [])

  React.useEffect(() => {
    if (!showPostSetupLoader) return

    const id = window.setTimeout(() => {
      setShowPostSetupLoader(false)
      toast.success("تم إنشاء المتجر بنجاح")
    }, STORE_SETUP_LOADER_FULL_CYCLE_MS)

    return () => window.clearTimeout(id)
  }, [showPostSetupLoader])

  return (
    <>
      <FullPageLoader active={showPostSetupLoader} loopMessages={false} />

      <div className="container py-6">
        <HomeMockDashboard />
      </div>
    </>
  )
}
