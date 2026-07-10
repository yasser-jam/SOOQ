"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Layers3 } from "lucide-react"

import { useStorePath } from "@/lib/store-path"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import CollectionCard from "./collection-card"
import { deleteProductCollection, listProductCollections } from "../actions"
import { collectionQueryKeys } from "../queryKeys"

const PAGE_SIZE = 12

export default function ProductCollectionGrid() {
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

  const { data: collections, isPending } = useQuery({
    queryKey: collectionQueryKeys.all,
    queryFn: listProductCollections,
  })

  const [pageIndex, setPageIndex] = useState(0)
  const totalCount = collections?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  useEffect(() => {
    setPageIndex((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  const pageItems =
    collections?.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE) ?? []

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (!collections || collections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <Layers3 className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">لا توجد مجموعات بعد</p>
        <p className="mt-1 text-sm text-muted-foreground">
          أنشئ مجموعة يدوية أو تلقائية لبدء تنظيم منتجاتك.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pageItems.map((collection) => {
          const collectionId = collection.id
          if (!collectionId) return null

          return (
            <CollectionCard
              key={collectionId}
              collection={collection}
              onEdit={() =>
                router.push(storePath(`/products/collections/${collectionId}`))
              }
              onDelete={() => deleteCollection(collectionId)}
            />
          )
        })}
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((p) => p - 1)}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            {pageIndex + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => setPageIndex((p) => p + 1)}
          >
            التالي
          </Button>
        </div>
      ) : null}
    </div>
  )
}
