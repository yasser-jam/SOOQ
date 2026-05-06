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

  const hasActiveFilter = Boolean(
    filters.status ||
      filters.shippingProviderId ||
      filters.createdAtFrom ||
      filters.createdAtTo
  )

  const updateField = <K extends keyof ShipmentFilters>(
    key: K,
    value: ShipmentFilters[K] | undefined
  ) =>
    onChange({
      ...filters,
      [key]: value,
    })

  return (
    <div className="grid gap-4 rounded-2xl border bg-card p-4 md:grid-cols-[1.4fr_1.4fr_1fr_1fr_auto]">
      <UiField>
        <FieldLabel htmlFor="shipment-filter-status">الحالة</FieldLabel>
        <Select
          value={filters.status ?? ALL_STATUSES_VALUE}
          onValueChange={(value) =>
            updateField(
              "status",
              value === ALL_STATUSES_VALUE
                ? undefined
                : (value as ShipmentStatus)
            )
          }
        >
          <SelectTrigger id="shipment-filter-status">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES_VALUE}>كل الحالات</SelectItem>
            {STATUS_VALUES.map((status) => (
              <SelectItem key={status} value={status}>
                {SHIPMENT_STATUS_META[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </UiField>

      <UiField>
        <FieldLabel htmlFor="shipment-filter-provider">مزود الشحن</FieldLabel>
        <Select
          value={filters.shippingProviderId ?? ALL_PROVIDERS_VALUE}
          onValueChange={(value) =>
            updateField(
              "shippingProviderId",
              value === ALL_PROVIDERS_VALUE ? undefined : value
            )
          }
        >
          <SelectTrigger id="shipment-filter-provider">
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
        <FieldLabel htmlFor="shipment-filter-from">من تاريخ</FieldLabel>
        <Input
          id="shipment-filter-from"
          type="date"
          dir="ltr"
          value={filters.createdAtFrom ?? ""}
          onChange={(event) =>
            updateField("createdAtFrom", event.target.value || undefined)
          }
          max={filters.createdAtTo}
        />
      </UiField>

      <UiField>
        <FieldLabel htmlFor="shipment-filter-to">إلى تاريخ</FieldLabel>
        <Input
          id="shipment-filter-to"
          type="date"
          dir="ltr"
          value={filters.createdAtTo ?? ""}
          onChange={(event) =>
            updateField("createdAtTo", event.target.value || undefined)
          }
          min={filters.createdAtFrom}
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
