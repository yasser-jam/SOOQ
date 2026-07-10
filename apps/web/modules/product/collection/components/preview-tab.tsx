"use client"

import { useQuery } from "@tanstack/react-query"
import { Eye } from "lucide-react"

import ImgPreview from "@/components/system/img-preview"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { previewCollectionRules } from "@/modules/product/collection/actions"
import { collectionQueryKeys } from "@/modules/product/collection/queryKeys"

type Props = {
  collectionId: string
  embedded?: boolean
}

export default function PreviewTab({ collectionId, embedded = false }: Props) {
  const { data, isPending } = useQuery({
    queryKey: collectionQueryKeys.preview(collectionId),
    queryFn: () => previewCollectionRules(collectionId),
  })

  return (
    <div className="flex flex-col gap-3">
      {!embedded ? (
        <p className="text-sm text-muted-foreground">
          المنتجات التي ستطابق القواعد الحالية (للقراءة فقط — لا تُحفظ في
          المجموعة).
        </p>
      ) : null}

      {isPending ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Eye className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            لا منتجات تطابق القواعد الحالية بعد. عدّل القواعد لتجربة معاينة
            مختلفة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {data.map((p) => (
            <Card key={p.productId}>
              <CardContent className="flex flex-col gap-2 p-3">
                <ImgPreview
                  url={p.primaryImageUrl}
                  alt=""
                  className="aspect-square w-full rounded object-cover"
                  fallback={
                    <div className="aspect-square w-full rounded bg-muted" />
                  }
                />
                <p className="truncate text-sm font-medium">
                  {p.titleAr ?? p.titleEn ?? p.productId}
                </p>
                {p.displayPrice ? (
                  <p className="text-xs text-muted-foreground">
                    {p.displayPrice}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
