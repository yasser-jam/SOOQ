import { PageHeader } from "@/components/system/PageHeader"
import { SessionsTable } from "@/modules/sessions/components/SessionsTable"

export default function AccountSessionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الجلسات" description="الجلسات النشطة على حسابك" />
      <SessionsTable />
    </div>
  )
}
