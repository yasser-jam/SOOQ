"use client"

import * as React from "react"
import {
  BadgePercent,
  ChevronDown,
  Circle,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Package,
  Palette,
  Receipt,
  ShoppingBag,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import { cn } from "@workspace/ui/lib/utils"

import { useState, useEffect, ComponentType } from 'react'

type NavChild = {
  title: string
  url: string
}

type NavItem = {
  title: string
  url: string
  icon: ComponentType<{ className?: string }>
  children?: readonly NavChild[]
}

const navItems: readonly NavItem[] = [
  {
    title: "لوحة التحكم",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "المنتجات",
    url: "/products",
    icon: Package,
    children: [
      { title: "المجموعات", url: "/products/collections" },
      { title: "المنتجات", url: "/products" },
      { title: "الوسوم", url: "/products/tags" },
      { title: "الفئات", url: "/products/categories" },
    ],
  },
  {
    title: "الطلبات",
    url: "/orders",
    icon: ShoppingBag,
  },
  {
    title: "أكواد الخصم",
    url: "/discount-codes",
    icon: BadgePercent,
  },
  {
    title: "الفواتير",
    url: "/invoices",
    icon: Receipt,
    children: [
      { title: "قائمة الفواتير", url: "/invoices" },
      { title: "قوالب الفاتورة", url: "/invoice-layouts" },
    ],
  },
  {
    title: "الخدمات اللوجستية",
    url: "/logistics",
    icon: Truck,
    children: [
      { title: "مزودي الشحن", url: "/logistics/shipping/providers" },
      { title: "الشحنات", url: "/logistics/shipping/shipments" },
    ],
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
    children: [
      { title: "تسوية تحصيل COD", url: "/finance/shipping/cod-reconciliation" },
    ],
  },
]

/** Matches `SidebarMenuButton` default variant hover/active tokens */
const subNavLinkClass =
  "mb-0.5 h-12 min-h-12 w-full translate-x-0 rounded-none border-secondary px-4 text-sm ring-sidebar-ring outline-hidden transition-all duration-300 hover:border-r-3 hover:bg-primary/5 hover:bg-white/5 hover:text-secondary focus-visible:ring-2 data-active:border-r-3 data-active:bg-primary/5 data-active:bg-white/5 data-active:font-normal data-active:text-secondary [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-current"

function useFallbackPathname() {
  const [pathname, setPathname] = useState("")
  useEffect(() => {
    const read = () => setPathname(window.location.pathname)
    read()
    window.addEventListener("popstate", read)
    return () => window.removeEventListener("popstate", read)
  }, [])
  return pathname
}

function isRouteActive(pathname: string, url: string) {
  if (pathname === url) return true
  if (url !== "/" && pathname.startsWith(`${url}/`)) return true
  return false
}

function isExactMatch(pathname: string, url: string) {
  return pathname === url
}

function NavMenuItem({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  const Icon = item.icon
  const children = item.children
  const hasChildren = Boolean(children?.length)

  const hasActiveChild = Boolean(
    children?.some((c) => isRouteActive(pathname, c.url))
  )

  
  const [open, setOpen] = useState(hasActiveChild)

  useEffect(() => {
    if (hasActiveChild) setOpen(true)
  }, [hasActiveChild])

  const parentRowActive =
    isRouteActive(pathname, item.url) || hasActiveChild

  if (!hasChildren) {
    
    return (
      <SidebarMenuItem>
        <SidebarMenuButton isActive={isRouteActive(pathname, item.url)} asChild>
          <a href={item.url}>
            <Icon />
            <span>{item.title}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        isActive={parentRowActive}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full justify-between gap-2"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <Icon />
          <span className="truncate">{item.title}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform duration-300",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </SidebarMenuButton>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <SidebarMenuSub className="mx-0 border-none px-2 py-1">
            {children!.map((child) => (
              <SidebarMenuSubItem key={child.url}>
                <SidebarMenuSubButton
                  asChild
                  isActive={isExactMatch(pathname, child.url)}
                  className={subNavLinkClass}
                >
                  <a href={child.url}>
                    <Circle
                      className="shrink-0 fill-current w-[1px] h-[10px]!"
                      aria-hidden
                    />
                    <span>{child.title}</span>
                  </a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </div>
      </div>
    </SidebarMenuItem>
  )
}

export type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  /** When set (e.g. `usePathname()` in the Next.js app), active state updates on client navigation. */
  pathname?: string
  user: any
}

export function AppSidebar({ pathname: pathnameProp, user, ...props }: AppSidebarProps) {
  const fallbackPathname = useFallbackPathname()
  const pathname = pathnameProp ?? fallbackPathname

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
                <span className="truncate text-2xl font-medium">
                  لوحة تحكم المتجر
                </span>

                <span className="text-sm text-gray-200">{user?.storeConfigId}</span>
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
              {navItems.map((item) => (
                <NavMenuItem
                  key={item.url}
                  item={item}
                  pathname={pathname}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
