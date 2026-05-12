"use client"

import { useParams } from "next/navigation"

import RequireRole from "@/modules/auth/auth/components/RequireRole"
import StaffForm from "@/modules/store/staff/components/StaffForm"

export default function CreateStaffPage() {
  const params = useParams<{ storeSlug: string }>()
  const storeSlug = params?.storeSlug ?? ""

  return (
    <div className="container flex flex-col gap-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">إضافة موظف</h1>
        <p className="text-sm text-muted-foreground">
          أنشئ حساباً جديداً وعيّن صلاحياته في خطوة واحدة.
        </p>
      </header>

      <RequireRole roles={["OWNER", "MANAGER"]}>
        <StaffForm storeSlug={storeSlug} />
      </RequireRole>
    </div>
  )
}
