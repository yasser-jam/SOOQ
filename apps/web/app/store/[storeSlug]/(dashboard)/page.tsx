"use client"

import { HomeMockDashboard } from "@/components/home-mock-dashboard"
import {
  FullPageLoader,
} from "@/components/full-page-loader"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { ApiResponse } from "@/lib/types"

export default function HomePage() {
  const { data: userProfile, isPending } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => api<ApiResponse<any>>("admin/store/settings"),
    select: (data) => data?.data,
  })

  const [loading, setLoading] = useState(true)

  // stop loader after 2 seconds
  useEffect(() => {
    if (!isPending && userProfile) {
      setTimeout(() => {
        setLoading(false)
      }, 2000)
    }
  }, [isPending])
  
  return (
    <>
      <FullPageLoader active={isPending || loading} loopMessages={false} />

      <div className="container py-6">
        <HomeMockDashboard />
      </div>
    </>
  )
}
