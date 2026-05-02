"use client"

import ShipmentsTable from "./shipments-table"

export default function ShipmentsPageView() {
  return (
    <div className="container">
      <div className="my-6 flex justify-between">
        <div className="page-title">الشحنات</div>
      </div>

      <ShipmentsTable />
    </div>
  )
}
