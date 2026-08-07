"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2Icon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  UserIcon,
} from "lucide-react"

import { siteConfig } from "@/config/site-config"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboardIcon },
  { href: "/tenants", label: "المتاجر", icon: Building2Icon },
  { href: "/audit-log", label: "سجل التدقيق", icon: ClipboardListIcon },
  { href: "/account", label: "حسابي", icon: UserIcon },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b px-4 py-4">
        <span className="text-lg font-bold text-primary">{siteConfig.name}</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col">{children}</div>
    </SidebarProvider>
  )
}
