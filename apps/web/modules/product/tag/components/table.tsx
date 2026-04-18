"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"

import TableActions from "@/components/system/table-actions"
import DataTable from "@/components/system/table"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"

import type { ProductTag } from "../types"
import { LucidePuzzle } from "lucide-react"
import { useRouter } from "next/navigation"



export default function Table() {

  const router = useRouter()

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
            <span>
              {tag.tagName}
            </span>
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
    cell: (tag) => (
      <TableActions onUpdate={() => router.push(`/products/tags/${tag.row.id}`)} />
    ),
  },
]

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const { productTags } = await import("../data")
      return productTags
    },
  })

  const pageSize = 10
  const [pageIndex, setPageIndex] = React.useState(0)
  const totalCount = tags?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

  React.useEffect(() => {
    setPageIndex((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  const pagedTags = React.useMemo(() => {
    if (!tags?.length) return []
    const start = pageIndex * pageSize
    return tags.slice(start, start + pageSize)
  }, [pageIndex, pageSize, tags])

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <DataTable
        columns={columns}
        data={pagedTags}
        pagination={{ pageIndex, pageSize, pageCount }}
        onPageChange={setPageIndex}
      />
    </div>
  )
}
