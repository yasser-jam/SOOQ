"use client"

import RequireRole from "@/modules/auth/auth/components/RequireRole"
import StaffTable from "@/modules/store/staff/components/StaffTable"

export default function StaffListPage() {
  return (
    <div className="container flex flex-col gap-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">الموظفون</h1>
        <p className="text-sm text-muted-foreground">
          إدارة فريق المتجر والصلاحيات. متاحة لمالكي المتجر والمدراء فقط.
        </p>
      </header>

      <RequireRole roles={["OWNER", "MANAGER"]}>
        <StaffTable />
      </RequireRole>
    </div>
  )
}
