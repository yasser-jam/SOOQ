"use client"

import { useParams } from "next/navigation"

import RequireRole from "@/modules/auth/auth/components/RequireRole"
import StaffDetailView from "@/modules/store/staff/components/StaffDetailView"

export default function StaffDetailPage() {
  const params = useParams<{ storeSlug: string; staffId: string }>()
  const storeSlug = params?.storeSlug ?? ""
  const staffId = params?.staffId ?? ""

  return (
    <div className="container flex flex-col gap-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">تفاصيل الموظف</h1>
        <p className="text-sm text-muted-foreground">
          عرض البيانات وتعديل الصلاحيات وإدارة حالة الحساب.
        </p>
      </header>

      <RequireRole roles={["OWNER", "MANAGER"]}>
        <StaffDetailView staffId={staffId} storeSlug={storeSlug} />
      </RequireRole>
    </div>
  )
}
