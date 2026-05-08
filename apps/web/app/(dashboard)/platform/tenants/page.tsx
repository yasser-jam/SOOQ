"use client"

import RequireRole from "@/modules/auth/auth/components/RequireRole"
import PlatformTenantsTable from "@/modules/auth/platform/components/PlatformTenantsTable"

export default function PlatformTenantsPage() {
  return (
    <div className="container flex flex-col gap-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">متاجر المنصة</h1>
        <p className="text-sm text-muted-foreground">
          عرض وإدارة جميع متاجر المنصة. متاح لمشرفي المنصة فقط.
        </p>
      </header>

      <RequireRole roles={["PLATFORM_ADMIN"]}>
        <PlatformTenantsTable />
      </RequireRole>
    </div>
  )
}
