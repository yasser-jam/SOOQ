"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Package } from "lucide-react"

import TableActions from "@/components/system/table-actions"
import DataTable from "@/components/system/table"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"

import type { Product } from "../types"
import { deleteProduct, listProductsQueryOptions, productKeys } from "../actions"

export default function ProductTable() {
	const router = useRouter()
	const queryClient = useQueryClient()

	const { mutate: removeProduct } = useMutation({
		mutationFn: deleteProduct,
		onSuccess: ({ id }) => {
			queryClient.invalidateQueries({ queryKey: productKeys.all })
			queryClient.removeQueries({ queryKey: productKeys.detail(id) })
		},
	})

	const columns: ColumnDef<Product>[] = [
		{
			accessorKey: "titleAr",
			header: "المنتج",
			enableSorting: true,
			cell: ({ row }) => {
				const product = row.original

				return (
					<div className="flex items-center gap-3">
						<Avatar>
							<AvatarFallback>
								<Package size="18" />
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col gap-0.5">
							<span>{product.titleAr}</span>
							<span className="text-xs text-muted-foreground">{product.titleEn}</span>
						</div>
					</div>
				)
			},
		},
		{
			accessorKey: "slug",
			header: "الرابط",
			cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.slug}</span>,
		},
		{
			accessorKey: "basePrice",
			header: "السعر",
			cell: ({ row }) => (
				<span>
					{row.original.basePrice.toLocaleString("en-US")} {row.original.currencyCode}
				</span>
			),
		},
		{
			accessorKey: "status",
			header: "الحالة",
			cell: ({ row }) => {
				const status = row.original.status

				if (status === "ACTIVE") {
					return <Badge variant="secondary-tonal">نشط</Badge>
				}

				if (status === "ARCHIVED") {
					return <Badge variant="outline">مؤرشف</Badge>
				}

				return <Badge variant="secondary">مسودة</Badge>
			},
		},
		{
			id: "actions",
			enableSorting: false,
			header: () => <div></div>,
			cell: ({ row }) => {
				const productId = row.original.id

				return (
					<TableActions
						onUpdate={() => {
							if (!productId) return
							router.push(`/products/${productId}`)
						}}
						onDelete={() => {
							if (!productId) return
							removeProduct(productId)
						}}
					/>
				)
			},
		},
	]

	const { data: products } = useQuery(listProductsQueryOptions())

	const pageSize = 10
	const [pageIndex, setPageIndex] = React.useState(0)
	const totalCount = products?.length ?? 0
	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

	React.useEffect(() => {
		setPageIndex((current) => Math.min(current, pageCount - 1))
	}, [pageCount])

	const pagedProducts = React.useMemo(() => {
		if (!products?.length) return []
		const start = pageIndex * pageSize
		return products.slice(start, start + pageSize)
	}, [products, pageIndex, pageSize])

	return (
		<div className="w-full overflow-hidden rounded-lg border">
			<DataTable
				columns={columns}
				data={pagedProducts}
				pagination={{ pageIndex, pageSize, pageCount }}
				onPageChange={setPageIndex}
			/>
		</div>
	)
}
