import * as React from "react"
import {
  CircleDollarSign,
  LayoutDashboard,
  Package,
  Palette,
  Store,
  Truck,
  Users,
} from "lucide-react"

// import { SearchForm } from "@workspace/ui/components/search-form"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  // SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar"

const navItems = [
  {
    title: "لوحة التحكم",
    url: "/",
    icon: LayoutDashboard,
    isActive: true
  },
  {
    title: "المنتجات",
    url: "/products",
    icon: Package,
  },
  {
    title: "الخدمات اللوجستية",
    url: "/logistics",
    icon: Truck,
  },
  {
    title: "استوديو التصميم",
    url: "/design-studio",
    icon: Palette,
  },
  {
    title: "العملاء",
    url: "/customers",
    icon: Users,
  },
  {
    title: "المالية",
    url: "/finance",
    icon: CircleDollarSign,
  },
] as const

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
  const isActive = (url: string) => {
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : ""
    return (
      pathname === url ||
      (url !== "/" && pathname.startsWith(`${url}/`))
    )
  }
  
  return (
    <Sidebar {...props} side="right" dir="rtl">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex flex-col items-center justify-center">
            <SidebarMenuButton
              size="lg"
              className="pointer-events-none cursor-default py-16"
            >
              <div className="flex flex-col gap-4 text-start">
                <span className="text-2xl truncate font-medium ">لوحة تحكم المتجر</span>

                <span className="text-sm text-gray-200">لوحة التاجر</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* <SearchForm /> */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>قسم</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem  key={item.url}>
                    <SidebarMenuButton isActive={isActive(item.url)} asChild>
                      <a href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
