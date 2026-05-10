"use client"

import { useState } from "react"

import { useStorePath } from "@/lib/store-path"
import { Button } from "@workspace/ui/components/button"

import type { CodReconciliationFilters } from "../types"
import CodReconciliationFiltersBar from "./cod-reconciliation-filters"
import CodReconciliationTable from "./cod-reconciliation-table"

export default function CodReconciliationPageView() {
  const storePath = useStorePath()
  const [filters, setFilters] = useState<CodReconciliationFilters>({})

  return (
    <div className="container">
      <div className="my-6 flex items-center justify-between">
        <div className="page-title">تسوية تحصيل COD</div>

        <Button asChild>
          <a href={storePath("/finance/shipping/cod-reconciliation/create")}>
            إنشاء دفعة تسوية
          </a>
        </Button>
      </div>

      <div className="mb-4">
        <CodReconciliationFiltersBar filters={filters} onChange={setFilters} />
      </div>

      <CodReconciliationTable filters={filters} />
    </div>
  )
}
