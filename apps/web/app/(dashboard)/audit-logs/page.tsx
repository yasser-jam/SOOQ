"use client"

import RequireRole from "@/modules/auth/auth/components/RequireRole"
import AuditLogTable from "@/modules/auth/audit-log/components/AuditLogTable"

export default function AuditLogsPage() {
  return (
    <div className="container flex flex-col gap-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">سجل التدقيق</h1>
        <p className="text-sm text-muted-foreground">
          استعرض العمليات التي تمت على متجرك. متاح لمالكي المتجر والمدراء فقط.
        </p>
      </header>

      <RequireRole roles={["OWNER", "MANAGER", "PLATFORM_ADMIN"]}>
        <AuditLogTable />
      </RequireRole>
    </div>
  )
}
