import SessionsTable from "@/modules/auth/session/components/SessionsTable"

export const metadata = {
  title: "الجلسات النشطة | SOOQ",
}

export default function SessionsPage() {
  return (
    <div className="container flex flex-col gap-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">الجلسات النشطة</h1>
        <p className="text-sm text-muted-foreground">
          راجع الأجهزة المسجل دخولها لحسابك، وأنهِ أي جلسة لا تتعرّف عليها.
        </p>
      </header>

      <SessionsTable />
    </div>
  )
}
