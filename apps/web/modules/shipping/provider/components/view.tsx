"use client"

import FilterMenu from "@/components/system/filter-menu"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import ProvidersTable from "./table"

export default function ShippingProvidersPageView() {
  const router = useRouter()

  return (
    <div className="container">
      <div className="my-6 flex justify-between">
        <div className="page-title">مزودي الشحن</div>

        <div className="flex items-center gap-4">
          <FilterMenu>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="shipping-provider-filter">الاسم</FieldLabel>
                <FieldContent>
                  <Input
                    id="shipping-provider-filter"
                    type="search"
                    placeholder="ابحث عن مزود"
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
          </FilterMenu>

          <Button
            size="md"
            variant="secondary"
            onClick={() => router.push("/logistics/shipping/providers/create")}
          >
            إضافة مزود
            <Plus data-icon="inline-end" />
          </Button>
        </div>
      </div>

      <ProvidersTable />
    </div>
  )
}
