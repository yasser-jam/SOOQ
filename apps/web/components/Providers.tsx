"use client"
import { DirectionProvider } from "@radix-ui/react-direction"
import { AppSidebar } from "@workspace/ui/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "next-themes"
import LayoutHeader from "./layout/LayoutHeader"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "./toaster"

function AppSidebarWithPathname() {
  const pathname = usePathname()
  return <AppSidebar pathname={pathname} />
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()

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
