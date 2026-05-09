"use client"

import { useQuery } from "@tanstack/react-query"
import { Eye } from "lucide-react"

import { Card, CardContent } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { previewCollectionRules } from "@/modules/product/collection/actions"
import { collectionQueryKeys } from "@/modules/product/collection/queryKeys"

type Props = {
  collectionId: string
}

export default function PreviewTab({ collectionId }: Props) {
  const { data, isPending } = useQuery({
    queryKey: collectionQueryKeys.preview(collectionId),
    queryFn: () => previewCollectionRules(collectionId),
  })

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        المنتجات التي ستطابق القواعد الحالية (للقراءة فقط — لا تُحفظ في
        المجموعة).
      </p>

      {isPending ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Eye className="size-10 text-muted-foreground mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">
            لا منتجات تطابق القواعد الحالية بعد. عدّل القواعد لتجربة معاينة
            مختلفة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.map((p) => (
            <Card key={p.productId}>
              <CardContent className="p-3 flex flex-col gap-2">
                {p.primaryImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.primaryImageUrl}
                    alt=""
                    className="w-full aspect-square rounded object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square rounded bg-muted" />
                )}
                <p className="text-sm font-medium truncate">
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
