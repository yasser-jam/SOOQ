"use client"
// Side effect: plugs the axios-backed data adapter into the editor core's
// binding layer before any bound block renders (C2-4 inversion).
import "@/lib/editor-data-adapter"
import { DirectionProvider } from "@radix-ui/react-direction"
import { AppSidebar } from "./app-sidebar"
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
import { getStoreSettingsQueryOptions } from "@/modules/store/settings/actions"
import StoreConfigurationGate from "@/modules/auth/store/components/StoreConfigurationGate"

function AppSidebarWithPathname() {
  // Sidebar consumes the same merchant store-settings query that the
  // settings/dashboard pages use, so saving in any tab (or the
  // onboarding wizard) refreshes the sidebar via shared cache key.
  const { data: settings } = useQuery(getStoreSettingsQueryOptions())
  const pathname = usePathname()

  return <AppSidebar pathname={pathname} user={settings} />
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

                <StoreConfigurationGate>{children}</StoreConfigurationGate>
              </SidebarInset>
            </SidebarProvider>
          </DirectionProvider>
        </QueryClientProvider>

        <Toaster position="top-right" />
      </ThemeProvider>
    </>
  )
}
