import { PageHeader } from "@/components/system/PageHeader"
import { SetupTotpDialog } from "@/modules/totp/components/SetupTotpDialog"

export default function AccountSecurityPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الأمان" description="المصادقة الثنائية وحماية الحساب" />
      <SetupTotpDialog />
    </div>
  )
}
