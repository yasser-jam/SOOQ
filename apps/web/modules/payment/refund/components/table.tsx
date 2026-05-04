"use client"

import { useEffect, useMemo, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { Receipt } from "lucide-react"

import DataTable from "@/components/system/table"
import { formatSyp } from "@/lib/money"
import { formatOrderDateTime } from "@/modules/order/order/utils"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import { listRefunds } from "../actions"
import { REFUND_STATUS_META } from "../model"
import { refundQueryKeys } from "../queryKeys"
import type { Refund, RefundStatus } from "../types"

interface RefundsTableProps {
	statusFilter?: RefundStatus | "ALL"
}

export default function RefundsTable({
	statusFilter = "ALL",
}: RefundsTableProps) {
	const { data: refunds, isPending } = useQuery({
		queryKey: refundQueryKeys.all,
		queryFn: listRefunds,
	})

	const filtered = useMemo(() => {
		if (statusFilter === "ALL") return refunds ?? []
		return (refunds ?? []).filter((r) => r.status === statusFilter)
	}, [refunds, statusFilter])

	const columns: ColumnDef<Refund>[] = [
		{
			accessorKey: "orderId",
			header: "الطلب",
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					<Avatar>
						<AvatarFallback>
							<Receipt size="18" />
						</AvatarFallback>
					</Avatar>
					<span className="font-mono text-sm text-foreground" dir="ltr">
						{row.original.orderId.slice(0, 8)}…
					</span>
				</div>
			),
		},
		{
			accessorKey: "provider",
			header: "بوابة الدفع",
			cell: ({ row }) =>
				row.original.provider ? (
					<Badge variant="outline">{row.original.provider}</Badge>
				) : (
					<span className="text-muted-foreground">—</span>
				),
		},
		{
			accessorKey: "refundAmount",
			header: "المبلغ",
			cell: ({ row }) => (
				<span className="font-medium">
					{formatSyp(row.original.refundAmount)}
				</span>
			),
		},
		{
			accessorKey: "status",
			header: "الحالة",
			cell: ({ row }) => {
				const meta = REFUND_STATUS_META[row.original.status]
				return <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
			},
		},
		{
			accessorKey: "requestedAt",
			header: "تاريخ الطلب",
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{formatOrderDateTime(row.original.requestedAt) || "—"}
				</span>
			),
		},
		{
			id: "actions",
			enableSorting: false,
			header: () => <div></div>,
			cell: ({ row }) => (
				<Button variant="outline" size="sm" asChild>
					<a href={`/orders/${row.original.orderId}`}>عرض الطلب</a>
				</Button>
			),
		},
	]

	const pageSize = 10
	const [pageIndex, setPageIndex] = useState(0)
	const totalCount = filtered.length
	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

	useEffect(() => {
		setPageIndex(0)
	}, [statusFilter])

	useEffect(() => {
		setPageIndex((current) => Math.min(current, pageCount - 1))
	}, [pageCount])

	return (
		<div className="w-full overflow-hidden rounded-lg border bg-white">
			<DataTable
				columns={columns}
				isLoading={isPending}
				data={filtered}
				pagination={{ pageIndex, pageSize, pageCount }}
				onPageChange={setPageIndex}
			/>
		</div>
	)
}
