"use client"
import { useLogout } from "@/modules/auth/auth/hooks/useLogout"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export default function LayoutProfileMenu() {
  const { logout, isPending } = useLogout()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="flex">
        <Button variant="ghost" size="icon">
          <Avatar>
            <AvatarFallback>YJ</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-32">
        <DropdownMenuGroup>
          <DropdownMenuItem>الملف الشخصي</DropdownMenuItem>
          <DropdownMenuItem>الإعدادات</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              void logout()
            }}
          >
            تسجيل الخروج
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
