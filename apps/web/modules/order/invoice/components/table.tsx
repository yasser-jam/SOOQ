"use client"

import { useEffect, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Download, Receipt } from "lucide-react"

import DataTable from "@/components/system/table"
import EmptyState from "@/components/system/empty-state"
import { resolveMediaUrl } from "@/lib/media"
import { useStorePath } from "@/lib/store-path"
import { formatOrderDateTime } from "@/modules/order/order/utils"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"

import { listInvoices } from "../actions"
import { invoiceQueryKeys } from "../queryKeys"
import type { Invoice } from "../types"

export function InvoicesTable() {
	const router = useRouter()
	const storePath = useStorePath()

	const { data: invoices, isPending } = useQuery({
		queryKey: invoiceQueryKeys.list(),
		queryFn: listInvoices,
	})

	const columns: ColumnDef<Invoice>[] = [
		{
			accessorKey: "invoiceNumber",
			header: "رقم الفاتورة",
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					<Avatar>
						<AvatarFallback>
							<Receipt size="18" />
						</AvatarFallback>
					</Avatar>
					<span className="font-mono font-medium text-foreground" dir="ltr">
						{row.original.invoiceNumber}
					</span>
				</div>
			),
		},
		{
			accessorKey: "orderId",
			header: "رقم الطلب",
			cell: ({ row }) => (
				<span className="font-mono text-sm text-muted-foreground" dir="ltr">
					{row.original.orderId.slice(0, 8)}…
				</span>
			),
		},
		{
			accessorKey: "generatedAt",
			header: "تاريخ التوليد",
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{formatOrderDateTime(row.original.generatedAt) || "—"}
				</span>
			),
		},
		{
			id: "actions",
			enableSorting: false,
			header: () => <div></div>,
			cell: ({ row }) => {
				const pdfHref = resolveMediaUrl(row.original.pdfUrl)

				if (!pdfHref) {
					return <span className="text-muted-foreground">—</span>
				}

				return (
					<Button variant="outline" size="sm" asChild>
						<a href={pdfHref} target="_blank" rel="noopener noreferrer">
							تنزيل
							<Download data-icon="inline-end" />
						</a>
					</Button>
				)
			},
		},
	]

	const pageSize = 10
	const [pageIndex, setPageIndex] = useState(0)
	const totalCount = invoices?.length ?? 0
	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

	useEffect(() => {
		setPageIndex((current) => Math.min(current, pageCount - 1))
	}, [pageCount])

	return (
		<div className="w-full overflow-hidden rounded-lg border">
			<DataTable
				columns={columns}
				isLoading={isPending}
				data={invoices ?? []}
				pagination={{ pageIndex, pageSize, pageCount }}
				onPageChange={setPageIndex}
				emptyState={
					<EmptyState
						icon={<Receipt className="size-8" />}
						title="لا توجد فواتير"
						description="ولّد الفاتورة من صفحة تفاصيل الطلب، ثم ستظهر هنا للتنزيل."
						cta={{
							label: "الانتقال إلى الطلبات",
							onClick: () => router.push(storePath("/orders")),
						}}
					/>
				}
			/>
		</div>
	)
}
