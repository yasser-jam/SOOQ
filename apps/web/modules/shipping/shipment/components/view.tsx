"use client"

import { useState } from "react"

import type { ShipmentFilters } from "../types"
import ShipmentsFiltersBar from "./shipments-filters"
import ShipmentsTable from "./table"

export default function ShipmentsPageView() {
  const [filters, setFilters] = useState<ShipmentFilters>({})

  return (
    <div className="container">
      <div className="my-6 flex justify-between">
        <div className="page-title">الشحنات</div>
      </div>

      <div className="flex flex-col gap-4">
        <ShipmentsFiltersBar filters={filters} onChange={setFilters} />

        <ShipmentsTable filters={filters} />
      </div>
    </div>
  )
}
