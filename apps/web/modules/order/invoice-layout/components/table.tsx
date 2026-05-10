"use client"

import { useEffect, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { FileText, Star } from "lucide-react"

import DataTable from "@/components/system/table"
import TableActions from "@/components/system/table-actions"
import { useStorePath } from "@/lib/store-path"
import { formatOrderDate } from "@/modules/order/order/utils"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"

import {
	deleteInvoiceLayout,
	listInvoiceLayouts,
} from "../actions"
import { invoiceLayoutQueryKeys } from "../queryKeys"
import type { InvoiceLayoutProfile } from "../types"

export default function InvoiceLayoutsTable() {
	const router = useRouter()
	const storePath = useStorePath()
	const queryClient = useQueryClient()

	const { data: profiles, isPending } = useQuery({
		queryKey: invoiceLayoutQueryKeys.all,
		queryFn: listInvoiceLayouts,
	})

	const { mutate: removeProfile } = useMutation({
		mutationFn: deleteInvoiceLayout,
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: invoiceLayoutQueryKeys.all })
			queryClient.removeQueries({
				queryKey: invoiceLayoutQueryKeys.detail(id),
			})
		},
	})

	const columns: ColumnDef<InvoiceLayoutProfile>[] = [
		{
			accessorKey: "profileName",
			header: "اسم القالب",
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					<Avatar>
						<AvatarFallback>
							<FileText size="18" />
						</AvatarFallback>
					</Avatar>
					<span className="font-medium text-foreground">
						{row.original.profileName}
					</span>
				</div>
			),
		},
		{
			accessorKey: "isDefault",
			header: "الحالة",
			cell: ({ row }) =>
				row.original.isDefault ? (
					<Badge variant="secondary-tonal" className="gap-1.5">
						<Star size={14} />
						<span>الافتراضي</span>
					</Badge>
				) : (
					<Badge variant="outline">قالب عادي</Badge>
				),
		},
		{
			accessorKey: "createdAt",
			header: "تاريخ الإنشاء",
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{formatOrderDate(row.original.createdAt) || "—"}
				</span>
			),
		},
		{
			id: "actions",
			enableSorting: false,
			header: () => <div></div>,
			cell: ({ row }) => {
				const id = row.original.id

				return (
					<TableActions
						onUpdate={() => {
							if (!id) return
							router.push(storePath(`/invoice-layouts/${id}`))
						}}
						onDelete={() => {
							if (!id) return
							removeProfile(id)
						}}
					/>
				)
			},
		},
	]

	const pageSize = 10
	const [pageIndex, setPageIndex] = useState(0)
	const totalCount = profiles?.length ?? 0
	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

	useEffect(() => {
		setPageIndex((current) => Math.min(current, pageCount - 1))
	}, [pageCount])

	return (
		<div className="w-full overflow-hidden rounded-lg border bg-white">
			<DataTable
				columns={columns}
				isLoading={isPending}
				data={profiles ?? []}
				pagination={{ pageIndex, pageSize, pageCount }}
				onPageChange={setPageIndex}
			/>
		</div>
	)
}
