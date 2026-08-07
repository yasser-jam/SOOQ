import { PageHeader } from "@/components/system/PageHeader"
import { TenantsDataTable } from "@/modules/tenants/components/TenantsDataTable"

export default function TenantsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المتاجر"
        description="إدارة جميع متاجر المنصة"
      />
      <TenantsDataTable />
    </div>
  )
}
