"use client"

import { useEffect, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import TableActions from "@/components/system/table-actions"
import DataTable from "@/components/system/table"
import EmptyState from "@/components/system/empty-state"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"

import type { ProductTag } from "../types"
import { LucidePuzzle } from "lucide-react"
import { useRouter } from "next/navigation"
import { deleteProductTag, listProductTags } from "../actions"
import { tagQueryKeys } from "../queryKeys"

export default function Table() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: tags, isPending } = useQuery({
    queryKey: tagQueryKeys.all,
    queryFn: listProductTags
  })

  const { mutate: deleteTag } = useMutation({
    mutationFn: deleteProductTag,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.all })
      queryClient.removeQueries({ queryKey: tagQueryKeys.detail(id) })
    },
  })

  const columns: ColumnDef<ProductTag>[] = [
    {
      accessorKey: "tagName",
      enableSorting: true,
      header: "الاسم",
      cell: ({ row }) => {
        const tag = row.original

        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                <LucidePuzzle size="18" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <span>{tag.tagName}</span>
              <span className="text-xs text-muted-foreground">{tag.slug}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <div></div>,
      cell: (tag) => {
        const tagId = tag.row.original.id

        return (
          <TableActions
            onUpdate={() => {
              router.push(`/products/tags/${tagId}`)
            }}
            onDelete={() => {
              deleteTag(tagId!)
            }}
          />
        )
      },
    },
  ]

  const pageSize = 10
  const [pageIndex, setPageIndex] = useState(0)
  const totalCount = tags?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

  useEffect(() => {
    setPageIndex((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <DataTable
        columns={columns}
        isLoading={isPending}
        data={tags || []}
        pagination={{ pageIndex, pageSize, pageCount }}
        onPageChange={setPageIndex}
        emptyState={
          <EmptyState
            icon={<LucidePuzzle className="size-8" />}
            title="لا توجد وسوم"
            description="استخدم الوسوم لتصنيف المنتجات وفلترتها على واجهة المتجر."
            cta={{
              label: "إضافة وسم",
              onClick: () => router.push("/products/tags/create"),
            }}
          />
        }
      />
    </div>
  )
}
