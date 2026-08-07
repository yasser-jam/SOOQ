"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { useState } from "react"

import { AppShell } from "@/components/layout/AppSidebar"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { TopBar } from "@/components/layout/TopBar"
import { Toaster } from "@/components/toaster"
import { RequirePlatformAdmin } from "@/modules/auth/components/RequirePlatformAdmin"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      })
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <RequirePlatformAdmin>
          <AppShell>
            <TopBar />
            <main className="container flex-1 py-6">
              <Breadcrumbs />
              {children}
            </main>
          </AppShell>
        </RequirePlatformAdmin>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
