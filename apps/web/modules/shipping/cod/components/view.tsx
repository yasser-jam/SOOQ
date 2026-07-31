"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import FilterMenu from "@/components/system/filter-menu"
import { useStorePath } from "@/lib/store-path"
import { Button } from "@workspace/ui/components/button"

import type { CodReconciliationFilters } from "../types"
import CodReconciliationFiltersBar from "./filters"
import CodReconciliationTable from "./table"

export default function CodReconciliationPageView() {
  const router = useRouter()
  const storePath = useStorePath()
  const [filters, setFilters] = useState<CodReconciliationFilters>({})

  return (
    <div className="container">
      <div className="my-6 flex justify-between">
        <div className="page-title">تسوية تحصيل COD</div>

        <div className="flex items-center gap-4">
          <FilterMenu>
            <CodReconciliationFiltersBar
              filters={filters}
              onChange={setFilters}
            />
          </FilterMenu>

          <Button
            size="md"
            variant="secondary"
            onClick={() =>
              router.push(
                storePath("/finance/shipping/cod-reconciliation/create")
              )
            }
          >
            إنشاء دفعة تسوية
            <Plus data-icon="inline-end" />
          </Button>
        </div>
      </div>

      <CodReconciliationTable filters={filters} />
    </div>
  )
}
