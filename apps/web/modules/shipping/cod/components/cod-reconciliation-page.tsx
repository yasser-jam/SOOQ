"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import { useStorePath } from "@/lib/store-path"
import { Button } from "@workspace/ui/components/button"

import type { CodReconciliationFilters } from "../types"
import CodReconciliationFiltersBar from "./cod-reconciliation-filters"
import CodReconciliationTable from "./cod-reconciliation-table"

export default function CodReconciliationPageView() {
  const storePath = useStorePath()
  const router = useRouter()
  const [filters, setFilters] = useState<CodReconciliationFilters>({})

  return (
    <div className="container py-8">
      {/* Header Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#122640" }}>
            تسوية تحصيل COD
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            إدارة ومتابعة دفعات تسوية التحصيل عند الاستلام
          </p>
        </div>

        <button
          onClick={() => router.push(storePath("/finance/shipping/cod-reconciliation/create"))}
          className="flex items-center rounded-lg bg-[#BA7B1B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#A56A18]"
        >
          إنشاء دفعة تسوية
          <Plus className="mr-2 size-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="mb-6">
        <CodReconciliationFiltersBar filters={filters} onChange={setFilters} />
      </div>

      {/* Table */}
      <CodReconciliationTable filters={filters} />
    </div>
  )
}
