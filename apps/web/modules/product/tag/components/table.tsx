"use client"

import { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { PencilIcon, Trash2Icon } from "lucide-react"

import DataTable from "@/components/system/table"
import { getInitials } from "@/lib/initials"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"

import type { ProductTag } from "../types"

const columns: ColumnDef<ProductTag>[] = [
  {
    accessorKey: "tagName",
    header: "Name",
    cell: ({ row }) => {
      const tag = row.original
      const initials = getInitials(tag.tagName)

      return (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>{initials || "T"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
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
    header: () => <div className="text-end">Actions</div>,
    cell: () => (
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="icon" aria-label="Edit tag">
          <PencilIcon data-icon="inline-start" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Delete tag">
          <Trash2Icon data-icon="inline-start" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    ),
  },
]

export default function Table() {
  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const { productTags } = await import("../data")
      return productTags
    },
  })

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <DataTable columns={columns} data={tags ?? []} />
    </div>
  )
}
