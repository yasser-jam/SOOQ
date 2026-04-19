"use client"
import { removeCookie } from "@/lib/cookies"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { useRouter } from "next/navigation"

export default function LayoutProfileMenu() {
  const router = useRouter()

  const logout = () => {
    removeCookie("sooq-access-token")
    router.push("/request-otp")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="flex">
        <Button variant="ghost" size="icon">
          <Avatar>
            <AvatarImage
              src="https://randomuser.me/api/portraits/men/1.jpg"
              className="border border-2 border-gray-500"
              alt="shadcn"
            />
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
          <DropdownMenuItem variant="destructive" onClick={logout}>
            تسجيل الخروج
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
