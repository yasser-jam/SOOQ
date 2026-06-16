"use client"

import { useEffect, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Bot, Hand, Layers3 } from "lucide-react"

import TableActions from "@/components/system/table-actions"
import DataTable from "@/components/system/table"
import { useStorePath } from "@/lib/store-path"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"

import type { ProductCollection } from "../types"
import { deleteProductCollection, listProductCollections } from "../actions"
import { collectionQueryKeys } from "../queryKeys"

export default function ProductCollectionTable() {
  const router = useRouter()
  const storePath = useStorePath()
  const queryClient = useQueryClient()

  const { mutate: deleteCollection } = useMutation({
    mutationFn: deleteProductCollection,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all })
      queryClient.removeQueries({ queryKey: collectionQueryKeys.detail(id) })
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
              <span className="text-xs text-muted-foreground">
                {collection.collectionSlug}
              </span>
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

        if (type === "MANUAL") {
          return (
            <Badge variant="primary" className="gap-1.5">
              <Hand size={14} />
              <span>يدوي</span>
            </Badge>
          )
        }

        return (
          <Badge variant="secondary" className="gap-1.5">
            <Bot size={14} />
            <span>تلقائي</span>
          </Badge>
        )
      },
    },
    {
      accessorKey: "descriptionAr",
      header: "الوصف",
      cell: ({ row }) => (
        <span className="block max-w-[300px] truncate text-sm text-gray-500">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Animi eius,
          officia modi autem eaque mollitia magnam ipsam laborum quisquam
          blanditiis quis repellendus harum nulla similique, nam saepe excepturi
          fuga exercitationem?
        </span>
      ),
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
              router.push(storePath(`/products/collections/${collectionId}`))
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

  const { data: collections, isPending } = useQuery({
    queryKey: collectionQueryKeys.all,
    queryFn: listProductCollections,
  })

  const pageSize = 10
  const [pageIndex, setPageIndex] = useState(0)
  const totalCount = collections?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

  useEffect(() => {
    setPageIndex((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <DataTable
        columns={columns}
        isLoading={isPending}
        data={collections || []}
        pagination={{ pageIndex, pageSize, pageCount }}
        onPageChange={setPageIndex}
      />
    </div>
  )
}
