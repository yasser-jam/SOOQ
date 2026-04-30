"use client"

import { Button } from "@workspace/ui/components/button"

import CodReconciliationTable from "./cod-reconciliation-table"

export default function CodReconciliationPageView() {
  return (
    <div className="container">
      <div className="my-6 flex items-center justify-between">
        <div className="page-title">تسوية تحصيل COD</div>

        <Button asChild>
          <a href="/finance/shipping/cod-reconciliation/create">إنشاء دفعة تسوية</a>
        </Button>
      </div>

      <CodReconciliationTable />
    </div>
  )
}
