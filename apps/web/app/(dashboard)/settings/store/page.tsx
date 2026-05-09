"use client"

import RequireRole from "@/modules/auth/auth/components/RequireRole"
import { useCurrentUser } from "@/modules/auth/auth/hooks/useCurrentUser"
import StoreRateLimitForm from "@/modules/auth/store/components/StoreRateLimitForm"
import StoreStatusForm from "@/modules/auth/store/components/StoreStatusForm"

function StoreSettingsContent() {
  const { user } = useCurrentUser()
  const tenantId = user?.tenantId ?? ""

  if (!tenantId) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
        تعذّر تحديد المتجر الحالي.
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <StoreStatusForm tenantId={tenantId} />
      <StoreRateLimitForm tenantId={tenantId} />
    </div>
  )
}

export default function StoreSettingsPage() {
  return (
    <div className="container flex flex-col gap-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">إعدادات المتجر</h1>
        <p className="text-sm text-muted-foreground">
          تحكّم في توفّر المتجر وحدّ المعدّل. هذه الصفحة متاحة لمالكي المتجر والمدراء فقط.
        </p>
      </header>

      <RequireRole roles={["OWNER", "MANAGER", "PLATFORM_ADMIN"]}>
        <StoreSettingsContent />
      </RequireRole>
    </div>
  )
}
