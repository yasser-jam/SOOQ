"use client"

import { useQuery } from "@tanstack/react-query"
import { X, Calendar, Filter } from "lucide-react"

import { listShippingProviders } from "@/modules/shipping/provider/actions"
import { shippingProviderQueryKeys } from "@/modules/shipping/provider/queryKeys"
import { Button } from "@workspace/ui/components/button"
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

  const clearFilters = () => {
    onChange({})
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-5 py-3 shadow-sm">
      {/* Title & Status */}
      <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
        <Filter className="size-4" style={{ color: "#BA7B1B" }} />
        <div className="flex flex-col">
          <span className="text-xs font-medium" style={{ color: "#122640" }}>
            الفلاتر
          </span>
          <span className="text-[10px] text-gray-500">
            {hasActiveFilter
              ? `${Object.keys(filters).length} نشط`
              : "غير نشط"}
          </span>
        </div>
      </div>

      {/* Shipping Provider */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="cod-filter-provider"
          className="text-[10px] font-medium text-gray-500"
        >
          مزود الشحن
        </label>
        <Select
          value={filters.shippingProviderId ?? ALL_PROVIDERS_VALUE}
          onValueChange={(value) =>
            updateField(
              "shippingProviderId",
              value === ALL_PROVIDERS_VALUE ? undefined : value
            )
          }
        >
          <SelectTrigger
            id="cod-filter-provider"
            className="h-9 w-[180px] rounded-lg border-slate-200 bg-slate-50 text-xs focus:border-[#BA7B1B] focus:ring-[#BA7B1B]"
          >
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
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-gray-500">من</label>
          <div className="relative">
            <Input
              type="date"
              dir="ltr"
              value={filters.settlementDateFrom ?? ""}
              onChange={(event) =>
                updateField("settlementDateFrom", event.target.value || undefined)
              }
              max={filters.settlementDateTo}
              className="h-9 w-[140px] rounded-lg border-slate-200 bg-slate-50 pr-3 pl-3 text-xs focus:border-[#BA7B1B] focus:ring-[#BA7B1B]"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-gray-500">إلى</label>
          <div className="relative">
            <Input
              type="date"
              dir="ltr"
              value={filters.settlementDateTo ?? ""}
              onChange={(event) =>
                updateField("settlementDateTo", event.target.value || undefined)
              }
              min={filters.settlementDateFrom}
              className="h-9 w-[140px] rounded-lg border-slate-200 bg-slate-50 pr-3 pl-3 text-xs focus:border-[#BA7B1B] focus:ring-[#BA7B1B]"
            />
          </div>
        </div>
      </div>

      {/* Clear Button */}
      {hasActiveFilter && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 px-3 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <X className="ml-1.5 size-3.5" />
          مسح
        </Button>
      )}
    </div>
  )
}
