import { Badge } from "@workspace/ui/components/badge"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { Bell, Home, WifiLow, WifiOff } from "lucide-react"
import LayoutProfileMenu from "./LayoutProfileMenu"
import { Button } from "@workspace/ui/components/button"

export default function LayoutHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />

      <div className="grow-1"></div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Badge variant="secondary-tonal" className="flex items-center gap-2">
            <WifiOff />
            الشبكة بطيئة
          </Badge>
        </div>

        <div className="relative text-primary">
          <Button variant={"ghost"} size={"icon"} className="relative">
            <Bell />
            <span className="absolute -top-0 -right-0 w-1.5 h-1.5 rounded-full bg-destructive"></span>
          </Button>
        </div>

        <div>
          <LayoutProfileMenu />
        </div>
      </div>
    </header>
  )
}
