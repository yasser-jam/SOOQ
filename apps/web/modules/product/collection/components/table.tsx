"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Layers3 } from "lucide-react"

import TableActions from "@/components/system/table-actions"
import DataTable from "@/components/system/table"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"

import type { ProductCollection } from "../types"
import {
	deleteProductCollection,
	listProductCollectionsQueryOptions,
	productCollectionKeys,
} from "../actions"

export default function ProductCollectionTable() {
	const router = useRouter()
	const queryClient = useQueryClient()

	const { mutate: deleteCollection } = useMutation({
		mutationFn: deleteProductCollection,
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: productCollectionKeys.all })
			queryClient.removeQueries({ queryKey: productCollectionKeys.detail(id) })
		},
	})

	const columns: ColumnDef<ProductCollection>[] = [
		{
			accessorKey: "collectionName",
			enableSorting: true,
			header: "الاسم",
			cell: ({ row }) => {
				const collection = row.original

				return (
					<div className="flex items-center gap-3">
						<Avatar>
							<AvatarFallback>
								<Layers3 size="18" />
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col gap-0.5">
							<span>{collection.collectionName}</span>
							<span className="text-xs text-muted-foreground">{collection.collectionSlug}</span>
						</div>
					</div>
				)
			},
		},
		{
			accessorKey: "collectionType",
			header: "نوع المجموعة",
			cell: ({ row }) => {
				const type = row.original.collectionType
				return <span>{type === "MANUAL" ? "يدوية" : "تلقائية"}</span>
			},
		},
		{
			accessorKey: "descriptionAr",
			header: "الوصف",
			cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.descriptionAr}</span>,
		},
		{
			accessorKey: "isActive",
			header: "الحالة",
			cell: ({ row }) => {
				const collection = row.original

				return collection.isActive ? (
					<Badge variant="secondary-tonal">نشطة</Badge>
				) : (
					<Badge variant="outline">غير نشطة</Badge>
				)
			},
		},
		{
			id: "actions",
			enableSorting: false,
			header: () => <div></div>,
			cell: (collection) => {
				const collectionId = collection.row.original.id

				return (
					<TableActions
						onUpdate={() => {
							if (!collectionId) return
							router.push(`/products/collections/${collectionId}`)
						}}
						onDelete={() => {
							if (!collectionId) return
							deleteCollection(collectionId)
						}}
					/>
				)
			},
		},
	]

	const { data: collections } = useQuery(listProductCollectionsQueryOptions())

	const pageSize = 10
	const [pageIndex, setPageIndex] = React.useState(0)
	const totalCount = collections?.length ?? 0
	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

	React.useEffect(() => {
		setPageIndex((current) => Math.min(current, pageCount - 1))
	}, [pageCount])

	const pagedCollections = React.useMemo(() => {
		if (!collections?.length) return []
		const start = pageIndex * pageSize
		return collections.slice(start, start + pageSize)
	}, [collections, pageIndex, pageSize])

	return (
		<div className="w-full overflow-hidden rounded-lg border">
			<DataTable
				columns={columns}
				data={pagedCollections}
				pagination={{ pageIndex, pageSize, pageCount }}
				onPageChange={setPageIndex}
			/>
		</div>
	)
}
