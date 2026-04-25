"use client"

import { useMemo, useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import {
  ArrowBigLeft,
  ArrowDownAZ,
  ArrowUpLeft,
  ArrowUpRight,
  Layers3,
  PlusIcon,
} from "lucide-react"

import TableActions from "@/components/system/table-actions"
import DataTable from "@/components/system/table"
import { getInitials } from "@/lib/initials"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"

import {
  deleteProductCategory,
  listProductCategories,
  productCategoryKeys,
} from "../actions"
import type { ProductCategory } from "../types"
import { Button } from "@workspace/ui/components/button"

export default function ProductCategoryTable() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const pageSize = 10
  const [pageIndex, setPageIndex] = useState(0)

  // ===== Data Fetching =====
  const { data: categories, isPending } = useQuery({
    queryKey: productCategoryKeys.all,
    queryFn: listProductCategories,
  })

  // ===== Mutations =====
  const { mutate: deleteCategory } = useMutation({
    mutationFn: deleteProductCategory,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.all })
      queryClient.removeQueries({ queryKey: productCategoryKeys.detail(id) })
    },
  })

  // ===== Computed Values =====
  const totalCount = categories?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

  const parentCategoryNames = useMemo(() => {
    return new Map(
      (categories ?? []).map((category) => [category.id ?? "", category.nameAr])
    )
  }, [categories])

  const pagedCategories = useMemo(() => {
    if (!categories?.length) return []
    const start = pageIndex * pageSize
    return categories.slice(start, start + pageSize)
  }, [pageIndex, pageSize, categories])

  // ===== Pagination Reset =====
  useEffect(() => {
    setPageIndex((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  // ===== Table Columns =====
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
                {getInitials(category.nameEn) || <Layers3 size="18" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <span>{category.nameAr}</span>
              <span className="text-xs text-muted-foreground">
                {category.slug}
              </span>
            </div>
          </div>
        )
      },
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
        const categoryId =
          category.row.original.id || category.row.original.categoryId

        return (
          <TableActions
            onUpdate={() => {
              console.log(category)
              if (!categoryId) return
              router.push(`/products/categories/${categoryId}`)
            }}
            onDelete={() => {
              if (!categoryId) return
              deleteCategory(categoryId)
            }}
          >
            <Button
              variant="secondaryFlat"
              className="rounded-lg"
              size="icon"
              aria-label="Add subcategory"
              onClick={() =>
                router.push(`/products/categories/create?parentId=${categoryId}`)
              }
            >
              <PlusIcon data-icon="inline-start" className="p-0.5" />
            </Button>
          </TableActions>
        )
      },
    },
  ]

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <DataTable
        columns={columns}
        data={pagedCategories}
        pagination={{ pageIndex, pageSize, pageCount }}
        onPageChange={setPageIndex}
        isLoading={isPending}
        subrowsKey="children"
      />
    </div>
  )
}
