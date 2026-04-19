"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { Layers3, PencilIcon, Trash2Icon } from "lucide-react"

import ConfirmAlert from "@/components/system/confirm-alert"
import DataTable from "@/components/system/table"
import { getInitials } from "@/lib/initials"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import {
	deleteProductCategory,
	listProductCategoriesQueryOptions,
	productCategoryKeys,
} from "../actions"
import type { ProductCategory } from "../types"

function CategoryActions({
	onUpdate,
	onDelete,
}: {
	onUpdate?: () => void
	onDelete?: () => void
}) {
	const [open, setOpen] = React.useState(false)

	return (
		<div className="flex items-center justify-end gap-2">
			<Button
				variant="primary"
				className="rounded-lg"
				size="icon"
				aria-label="Edit category"
				onClick={onUpdate}
			>
				<PencilIcon data-icon="inline-start" className="p-0.5" />
			</Button>

			<Button
				variant="destructive"
				className="rounded-lg"
				size="icon"
				aria-label="Delete category"
				onClick={() => setOpen(true)}
			>
				<Trash2Icon data-icon="inline-start" className="p-0.5" />
			</Button>

			<ConfirmAlert
				open={open}
				onOpenChange={setOpen}
				variant="destructive"
				title="حذف الفئة"
				description="سيتم حذف الفئة نهائيا ولا يمكن التراجع عن هذا الإجراء."
				actionLabel="حذف"
				onAction={onDelete}
				icon={<Trash2Icon data-icon="inline-start" />}
			/>
		</div>
	)
}

export default function ProductCategoryTable() {
	const router = useRouter()
	const queryClient = useQueryClient()

	const { mutate: deleteCategory } = useMutation({
		mutationFn: deleteProductCategory,
		onSuccess: ({ id }) => {
			queryClient.invalidateQueries({ queryKey: productCategoryKeys.all })
			queryClient.removeQueries({ queryKey: productCategoryKeys.detail(id) })
		},
	})

	const { data: categories } = useQuery(listProductCategoriesQueryOptions())

	const parentCategoryNames = React.useMemo(() => {
		return new Map(
			(categories ?? []).map((category) => [category.id ?? "", category.nameAr])
		)
	}, [categories])

	const columns: ColumnDef<ProductCategory>[] = [
		{
			accessorKey: "nameAr",
			enableSorting: true,
			header: "الاسم",
			cell: ({ row }) => {
				const category = row.original

				return (
					<div className="flex items-center gap-3">
						<Avatar>
							<AvatarFallback>
								{getInitials(category.nameAr || category.nameEn || "C") || <Layers3 size="18" />}
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col gap-0.5">
							<span>{category.nameAr}</span>
							<span className="text-xs text-muted-foreground">{category.nameEn}</span>
						</div>
					</div>
				)
			},
		},
		{
			accessorKey: "slug",
			header: "الاسم المختصر",
			cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.slug}</span>,
		},
		{
			accessorKey: "parentCategoryId",
			header: "الفئة الأم",
			cell: ({ row }) => {
				const category = row.original
				const parentName = category.parentCategoryId
					? parentCategoryNames.get(category.parentCategoryId) ?? "—"
					: "فئة رئيسية"

				return <span>{parentName}</span>
			},
		},
		{
			accessorKey: "sortOrder",
			header: "الترتيب",
			cell: ({ row }) => <span>{row.original.sortOrder}</span>,
		},
		{
			accessorKey: "isActive",
			header: "الحالة",
			cell: ({ row }) => {
				const category = row.original

				return category.isActive ? (
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
			cell: (category) => {
				const categoryId = category.row.original.id

				return (
					<CategoryActions
						onUpdate={() => {
							if (!categoryId) return
							router.push(`/products/categories/${categoryId}`)
						}}
						onDelete={() => {
							if (!categoryId) return
							deleteCategory(categoryId)
						}}
					/>
				)
			},
		},
	]

	const pageSize = 10
	const [pageIndex, setPageIndex] = React.useState(0)
	const totalCount = categories?.length ?? 0
	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

	React.useEffect(() => {
		setPageIndex((current) => Math.min(current, pageCount - 1))
	}, [pageCount])

	const pagedCategories = React.useMemo(() => {
		if (!categories?.length) return []
		const start = pageIndex * pageSize
		return categories.slice(start, start + pageSize)
	}, [pageIndex, pageSize, categories])

	return (
		<div className="w-full overflow-hidden rounded-lg border">
			<DataTable
				columns={columns}
				data={pagedCategories}
				pagination={{ pageIndex, pageSize, pageCount }}
				onPageChange={setPageIndex}
			/>
		</div>
	)
}
