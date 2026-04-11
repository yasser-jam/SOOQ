'use client'
import { DirectionProvider } from "@radix-ui/react-direction";
import { AppSidebar } from "@workspace/ui/components/app-sidebar";
import { Separator } from "@workspace/ui/components/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar";
import { ThemeProvider } from "next-themes";
import LayoutHeader from "./layout/LayoutHeader";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeProvider>
        <DirectionProvider dir="rtl">
          <SidebarProvider>

            <AppSidebar />

            <SidebarInset>
              <LayoutHeader />
              
              {children}
            </SidebarInset>
          </SidebarProvider>
        </DirectionProvider>
      </ThemeProvider>
    </>
  )
}
