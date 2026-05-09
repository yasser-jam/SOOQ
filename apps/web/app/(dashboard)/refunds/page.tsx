"use client"

import { useState } from "react"

import RefundsTable from "@/modules/payment/refund/components/table"
import { REFUND_STATUS_META } from "@/modules/payment/refund/model"
import type { RefundStatus } from "@/modules/payment/refund/types"
import { Button } from "@workspace/ui/components/button"

type Filter = RefundStatus | "ALL"

const FILTERS: { value: Filter; label: string }[] = [
	{ value: "ALL", label: "الكل" },
	{ value: "PENDING", label: REFUND_STATUS_META.PENDING.label },
	{ value: "COMPLETED", label: REFUND_STATUS_META.COMPLETED.label },
	{ value: "FAILED", label: REFUND_STATUS_META.FAILED.label },
]

export default function RefundsPage() {
	const [filter, setFilter] = useState<Filter>("ALL")

	return (
		<div className="container">
			<div className="my-6 flex items-center justify-between">
				<div className="page-title">الاستردادات</div>
			</div>

			<div className="mb-4 flex w-fit items-center gap-2 rounded-xl border bg-card p-1">
				{FILTERS.map((option) => (
					<Button
						key={option.value}
						type="button"
						size="sm"
						variant={filter === option.value ? "secondary" : "ghost"}
						onClick={() => setFilter(option.value)}
					>
						{option.label}
					</Button>
				))}
			</div>

			<RefundsTable statusFilter={filter} />
		</div>
	)
}
