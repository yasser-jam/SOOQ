"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Filter, X, Calendar, Truck } from "lucide-react"

import type { ShipmentFilters } from "../types"
import type { ShipmentStatus } from "../types"
import ShipmentsFiltersBar from "./shipments-filters"
import ShipmentsTable from "./table"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Badge } from "@workspace/ui/components/badge"
import { SHIPMENT_STATUS_META } from "../model"

const STATUS_TABS: { value: ShipmentStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "الكل" },
  { value: "PENDING", label: "قيد الانتظار" },
  { value: "PICKED_UP", label: "تم الاستلام" },
  { value: "IN_TRANSIT", label: "قيد التوصيل" },
  { value: "DELIVERED", label: "تم التوصيل" },
  { value: "FAILED", label: "فشل" },
  { value: "RETURNED", label: "مرتجع" },
]

export default function ShipmentsPageView() {
  const [filters, setFilters] = useState<ShipmentFilters>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<ShipmentStatus | "ALL">("ALL")

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Update filters when tab changes
  useEffect(() => {
    if (activeTab === "ALL") {
      setFilters((prev) => {
        const { status, ...rest } = prev
        return rest
      })
    } else {
      setFilters((prev) => ({ ...prev, status: activeTab }))
    }
  }, [activeTab])

  const hasActiveFilter = Boolean(
    filters.status ||
      filters.shippingProviderId ||
      filters.createdAtFrom ||
      filters.createdAtTo
  )

  const clearFilters = () => {
    setFilters({})
    setSearchQuery("")
    setActiveTab("ALL")
  }

  const removeFilter = (key: keyof ShipmentFilters) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
    
    // If removing status, reset tab to ALL
    if (key === "status") {
      setActiveTab("ALL")
    }
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "#122640" }}>
          الشحنات
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          إدارة وتتبع جميع الشحنات في مكان واحد
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Status Tabs */}
        <div className="rounded-lg border bg-white p-2 shadow-sm">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`
                  relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all
                  ${
                    activeTab === tab.value
                      ? "bg-[#BA7B1B] text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                {tab.label}
                {/* Counter badge - placeholder for now, will be dynamic */}
                <span
                  className={`
                    flex size-5 items-center justify-center rounded-full text-xs
                    ${
                      activeTab === tab.value
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-600"
                    }
                  `}
                >
                  {/* TODO: Add actual counts from data */}
                  {tab.value === "ALL" ? "0" : "0"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Smart Toolbar */}
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center">
            {/* Global Search - Full Width */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="ابحث برقم الشحنة، اسم العميل، أو رقم الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 rounded-lg border-gray-200 pr-10 pl-4 text-sm focus:border-[#BA7B1B] focus:ring-[#BA7B1B]"
                />
              </div>
            </div>

            {/* Advanced Filters Button */}
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 rounded-lg border-gray-200 bg-white hover:bg-gray-50"
                  style={{ color: "#122640" }}
                >
                  <Filter className="mr-2 size-4" />
                  فلاتر متقدمة
                  {hasActiveFilter && (
                    <Badge className="ml-2 h-5 min-w-[20px] rounded-full bg-[#BA7B1B] px-1.5 text-xs text-white">
                      {Object.keys(filters).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-5" align="end">
                <div className="mb-4 flex items-center justify-between border-b pb-3">
                  <h3 className="text-base font-semibold" style={{ color: "#122640" }}>
                    فلاتر متقدمة
                  </h3>
                  {hasActiveFilter && (
                    <button
                      onClick={clearFilters}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      مسح الكل
                    </button>
                  )}
                </div>
                <ShipmentsFiltersBar filters={filters} onChange={setFilters} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Active Filters Tags */}
          {hasActiveFilter && (
            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
              <span className="text-xs font-medium text-gray-500">الفلاتر النشطة:</span>
              {filters.shippingProviderId && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
                  style={{ backgroundColor: "#F3F4F6", color: "#122640" }}
                >
                  <Truck className="size-3.5" />
                  مزود الشحن
                  <button
                    onClick={() => removeFilter("shippingProviderId")}
                    className="ml-0.5 rounded-full hover:bg-gray-300 p-0.5 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )}
              {(filters.createdAtFrom || filters.createdAtTo) && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
                  style={{ backgroundColor: "#F3F4F6", color: "#122640" }}
                >
                  <Calendar className="size-3.5" />
                  التاريخ
                  <button
                    onClick={() => {
                      removeFilter("createdAtFrom")
                      removeFilter("createdAtTo")
                    }}
                    className="ml-0.5 rounded-full hover:bg-gray-300 p-0.5 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Table Card */}
        <div className="rounded-lg border bg-white shadow-sm">
          <ShipmentsTable filters={filters} searchQuery={debouncedSearchQuery} />
        </div>
      </div>
    </div>
  )
}
