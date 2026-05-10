import PhoneChangeCard from "@/modules/auth/phone-change/components/PhoneChangeCard"

export const metadata = {
  title: "تغيير رقم الهاتف | SOOQ",
}

export default function PhoneChangePage() {
  return (
    <div className="container flex flex-col gap-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">تغيير رقم الهاتف</h1>
        <p className="text-sm text-muted-foreground">
          حدّث رقم الهاتف المرتبط بحسابك. سيتم تأكيد الرقم الجديد عبر رمز تحقق.
        </p>
      </header>

      <PhoneChangeCard />
    </div>
  )
}
