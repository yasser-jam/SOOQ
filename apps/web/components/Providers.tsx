"use client"
import { DirectionProvider } from "@radix-ui/react-direction"
import { AppSidebar } from "@workspace/ui/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "next-themes"
import { useState } from "react"
import LayoutHeader from "./layout/LayoutHeader"
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query"
import { Toaster } from "./toaster"
import { api } from "@/lib/api"
import { ApiResponse } from "@/lib/types"

function AppSidebarWithPathname() {
  // User Profile
  const { data: user } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => api<ApiResponse<any>>("admin/store/settings"),
    select: (data) => data?.data
  })



  const pathname = usePathname()
  return <AppSidebar pathname={pathname} user={user}  />
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      })
  )

  return (
    <>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <DirectionProvider dir="rtl">
            <SidebarProvider>
              <AppSidebarWithPathname />

              <SidebarInset>
                <LayoutHeader />

                {children}
              </SidebarInset>
            </SidebarProvider>
          </DirectionProvider>
        </QueryClientProvider>

        <Toaster position="top-right" />
      </ThemeProvider>
    </>
  )
}
