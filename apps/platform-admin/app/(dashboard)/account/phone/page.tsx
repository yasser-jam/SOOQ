import { PageHeader } from "@/components/system/PageHeader"
import { PhoneChangeForm } from "@/modules/phone-change/components/PhoneChangeForm"

export default function AccountPhonePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="رقم الهاتف" description="تغيير رقم تسجيل الدخول" />
      <PhoneChangeForm />
    </div>
  )
}
