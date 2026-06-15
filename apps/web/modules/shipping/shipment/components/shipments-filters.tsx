"use client"

import { useQuery } from "@tanstack/react-query"

import { listShippingProviders } from "@/modules/shipping/provider/actions"
import { shippingProviderQueryKeys } from "@/modules/shipping/provider/queryKeys"
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

import { SHIPMENT_STATUS_META } from "../model"
import type { ShipmentFilters } from "../types"
import type { ShipmentStatus } from "../types"

interface ShipmentsFiltersBarProps {
  filters: ShipmentFilters
  onChange: (filters: ShipmentFilters) => void
}

// Sentinel values: shadcn/radix Select rejects "" as an item value, so we
// translate to `undefined` before propagating up. Same pattern as the COD
// reconciliation filter bar.
const ALL_STATUSES_VALUE = "__all_statuses__"
const ALL_PROVIDERS_VALUE = "__all_providers__"

const STATUS_VALUES: ShipmentStatus[] = [
  "PENDING",
  "PICKED_UP",
  "IN_TRANSIT",
  "READY_FOR_PICKUP_AT_OFFICE",
  "DELIVERED",
  "FAILED",
  "RETURNED",
]

export default function ShipmentsFiltersBar({
  filters,
  onChange,
}: ShipmentsFiltersBarProps) {
  const { data: providers = [] } = useQuery({
    queryKey: shippingProviderQueryKeys.all,
    queryFn: listShippingProviders,
  })

  const updateField = <K extends keyof ShipmentFilters>(
    key: K,
    value: ShipmentFilters[K] | undefined
  ) =>
    onChange({
      ...filters,
      [key]: value,
    })

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <UiField>
        <FieldLabel htmlFor="shipment-filter-provider" className="text-sm font-medium" style={{ color: "#122640" }}>
          مزود الشحن
        </FieldLabel>
        <Select
          value={filters.shippingProviderId ?? ALL_PROVIDERS_VALUE}
          onValueChange={(value) =>
            updateField(
              "shippingProviderId",
              value === ALL_PROVIDERS_VALUE ? undefined : value
            )
          }
        >
          <SelectTrigger id="shipment-filter-provider" className="h-11 rounded-lg border-gray-200 text-sm focus:border-[#BA7B1B] focus:ring-[#BA7B1B]">
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
        <FieldLabel htmlFor="shipment-filter-date" className="text-sm font-medium" style={{ color: "#122640" }}>
          التاريخ
        </FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          <Input
            id="shipment-filter-from"
            type="date"
            dir="ltr"
            value={filters.createdAtFrom ?? ""}
            onChange={(event) =>
              updateField("createdAtFrom", event.target.value || undefined)
            }
            max={filters.createdAtTo}
            className="h-11 rounded-lg border-gray-200 text-sm focus:border-[#BA7B1B] focus:ring-[#BA7B1B]"
          />
          <Input
            id="shipment-filter-to"
            type="date"
            dir="ltr"
            value={filters.createdAtTo ?? ""}
            onChange={(event) =>
              updateField("createdAtTo", event.target.value || undefined)
            }
            min={filters.createdAtFrom}
            className="h-11 rounded-lg border-gray-200 text-sm focus:border-[#BA7B1B] focus:ring-[#BA7B1B]"
          />
        </div>
      </UiField>
    </div>
  )
}
