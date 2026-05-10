import TotpSetupCard from "@/modules/auth/totp/components/TotpSetupCard"

export const metadata = {
  title: "المصادقة الثنائية | SOOQ",
}

export default function TwoFactorPage() {
  return (
    <div className="container flex flex-col gap-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">المصادقة الثنائية</h1>
        <p className="text-sm text-muted-foreground">
          فعّل أو عطّل المصادقة الثنائية باستخدام تطبيق المصادقة على هاتفك.
        </p>
      </header>

      <TotpSetupCard />
    </div>
  )
}
