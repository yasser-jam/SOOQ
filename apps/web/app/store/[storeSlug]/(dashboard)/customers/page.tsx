import { Suspense } from "react"

import CustomersPageView from "@/modules/customer/customer/components/view"

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="container my-6">جاري التحميل…</div>}>
      <CustomersPageView />
    </Suspense>
  )
}
