"use client"

import { useQuery } from "@tanstack/react-query"
import { X } from "lucide-react"

import { listShippingProviders } from "@/modules/shipping/provider/actions"
import { shippingProviderQueryKeys } from "@/modules/shipping/provider/queryKeys"
import { Button } from "@workspace/ui/components/button"
import {
  Field as UiField,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { CodReconciliationFilters } from "../types"

interface CodReconciliationFiltersProps {
  filters: CodReconciliationFilters
  onChange: (filters: CodReconciliationFilters) => void
}

const ALL_PROVIDERS_VALUE = "__all__"

export default function CodReconciliationFiltersBar({
  filters,
  onChange,
}: CodReconciliationFiltersProps) {
  const { data: providers = [] } = useQuery({
    queryKey: shippingProviderQueryKeys.all,
    queryFn: listShippingProviders,
  })

  const hasActiveFilter = Boolean(
    filters.shippingProviderId ||
      filters.settlementDateFrom ||
      filters.settlementDateTo
  )

  const updateField = <K extends keyof CodReconciliationFilters>(
    key: K,
    value: CodReconciliationFilters[K] | undefined
  ) =>
    onChange({
      ...filters,
      [key]: value,
    })

  return (
    <div className="grid gap-4 rounded-2xl border bg-card p-4 md:grid-cols-[2fr_1fr_1fr_auto]">
      <UiField>
        <FieldLabel htmlFor="cod-filter-provider">مزود الشحن</FieldLabel>
        <Select
          value={filters.shippingProviderId ?? ALL_PROVIDERS_VALUE}
          onValueChange={(value) =>
            updateField(
              "shippingProviderId",
              value === ALL_PROVIDERS_VALUE ? undefined : value
            )
          }
        >
          <SelectTrigger id="cod-filter-provider">
            <SelectValue placeholder="كل المزودين" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PROVIDERS_VALUE}>كل المزودين</SelectItem>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id ?? ""}>
                {provider.providerName ?? provider.providerCode ?? "-"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </UiField>

      <UiField>
        <FieldLabel htmlFor="cod-filter-from">من تاريخ</FieldLabel>
        <Input
          id="cod-filter-from"
          type="date"
          dir="ltr"
          value={filters.settlementDateFrom ?? ""}
          onChange={(event) =>
            updateField("settlementDateFrom", event.target.value || undefined)
          }
          max={filters.settlementDateTo}
        />
      </UiField>

      <UiField>
        <FieldLabel htmlFor="cod-filter-to">إلى تاريخ</FieldLabel>
        <Input
          id="cod-filter-to"
          type="date"
          dir="ltr"
          value={filters.settlementDateTo ?? ""}
          onChange={(event) =>
            updateField("settlementDateTo", event.target.value || undefined)
          }
          min={filters.settlementDateFrom}
        />
      </UiField>

      <div className="flex items-end">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => onChange({})}
          disabled={!hasActiveFilter}
        >
          مسح الفلاتر
          <X data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
