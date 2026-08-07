"use client"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { LogOutIcon, UserIcon } from "lucide-react"
import Link from "next/link"

import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser"
import { useLogout } from "@/modules/auth/hooks/useLogout"

export function TopBar() {
  const { user } = useCurrentUser()
  const { logout, isPending } = useLogout()

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <SidebarTrigger />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <UserIcon className="size-4" />
            <span className="hidden sm:inline">{user?.username ?? "مدير المنصة"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem asChild>
            <Link href="/account">حسابي</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/sessions">الجلسات</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isPending}
            onClick={() => void logout()}
          >
            <LogOutIcon className="size-4" />
            تسجيل الخروج
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
