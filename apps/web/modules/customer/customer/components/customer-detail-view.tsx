"use client"

import { useQuery } from "@tanstack/react-query"
import { ChevronRight } from "lucide-react"

import { useStorePath } from "@/lib/store-path"
import { getAdminCustomer } from "@/modules/customer/customer/actions"
import CustomerAddressesCard from "@/modules/customer/customer/components/customer-addresses-card"
import CustomerPreferencesCard from "@/modules/customer/customer/components/customer-preferences-card"
import CustomerSummaryCard from "@/modules/customer/customer/components/customer-summary-card"
import { customerQueryKeys } from "@/modules/customer/customer/queryKeys"
import CustomerNotesCard from "@/modules/customer/customer-note/components/customer-notes-card"
import { Button } from "@workspace/ui/components/button"

interface CustomerDetailPageViewProps {
  customerId: string
}

export default function CustomerDetailPageView({
  customerId,
}: CustomerDetailPageViewProps) {
  const storePath = useStorePath()
  const { data: customer, isPending } = useQuery({
    queryKey: customerQueryKeys.detail(customerId),
    queryFn: () => getAdminCustomer(customerId),
  })

  return (
    <div className="container my-6 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          asChild
          className="gap-1 text-sm text-muted-foreground"
        >
          <a href={storePath("/customers")}>
            <ChevronRight className="size-4" />
            العودة إلى قائمة العملاء
          </a>
        </Button>
      </div>

      <CustomerSummaryCard customer={customer} isLoading={isPending} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <CustomerAddressesCard
            addresses={customer?.addresses}
            isLoading={isPending}
          />
        </div>
        <div className="xl:col-span-5">
          <CustomerPreferencesCard
            preferences={customer?.preferences}
            isLoading={isPending}
          />
        </div>
      </div>

      <CustomerNotesCard
        customerId={customerId}
        initialNotes={customer?.notes}
      />
    </div>
  )
}
