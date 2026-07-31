"use client"

import { useQuery } from "@tanstack/react-query"
import { X } from "lucide-react"

import { listShippingProviders } from "@/modules/shipping/provider/actions"
import { shippingProviderQueryKeys } from "@/modules/shipping/provider/queryKeys"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldGroup,
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
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="cod-filter-provider">مزود الشحن</FieldLabel>
        <FieldContent>
          <Select
            value={filters.shippingProviderId ?? ALL_PROVIDERS_VALUE}
            onValueChange={(value) =>
              updateField(
                "shippingProviderId",
                value === ALL_PROVIDERS_VALUE ? undefined : value
              )
            }
          >
            <SelectTrigger id="cod-filter-provider" className="w-full">
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
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="cod-filter-date-from">من تاريخ</FieldLabel>
        <FieldContent>
          <Input
            id="cod-filter-date-from"
            type="date"
            dir="ltr"
            value={filters.settlementDateFrom ?? ""}
            onChange={(event) =>
              updateField(
                "settlementDateFrom",
                event.target.value || undefined
              )
            }
            max={filters.settlementDateTo}
            className="rounded-lg"
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="cod-filter-date-to">إلى تاريخ</FieldLabel>
        <FieldContent>
          <Input
            id="cod-filter-date-to"
            type="date"
            dir="ltr"
            value={filters.settlementDateTo ?? ""}
            onChange={(event) =>
              updateField(
                "settlementDateTo",
                event.target.value || undefined
              )
            }
            min={filters.settlementDateFrom}
            className="rounded-lg"
          />
        </FieldContent>
      </Field>

      {hasActiveFilter ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({})}
        >
          مسح الفلاتر
          <X data-icon="inline-end" />
        </Button>
      ) : null}
    </FieldGroup>
  )
}
