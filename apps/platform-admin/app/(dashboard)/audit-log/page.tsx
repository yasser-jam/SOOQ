import { PageHeader } from "@/components/system/PageHeader"
import { AuditLogTable } from "@/modules/audit/components/AuditLogTable"

export default function AuditLogPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="سجل التدقيق"
        description="جميع عمليات المنصة المسجّلة"
      />
      <AuditLogTable />
    </div>
  )
}
