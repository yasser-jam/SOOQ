"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"

import { listCollectionProducts } from "@/modules/product/collection/actions"
import { collectionQueryKeys } from "@/modules/product/collection/queryKeys"
import { Card } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"

export default function CollectionViewPage() {
  const params = useParams()
  const router = useRouter()
  const collectionId = params?.["collection-id"]?.toString() ?? ""

  const { data: items, isLoading } = useQuery({
    queryKey: collectionQueryKeys.products(collectionId),
    queryFn: () => listCollectionProducts(collectionId),
    enabled: Boolean(collectionId),
  })

  return (
    <div className="container">
      <div className="my-6 flex items-center justify-between">
        <div className="page-title">عناصر المجموعة</div>
        <Button onClick={() => router.push('/products/collections')}>العودة</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div>جارٍ التحميل...</div>
        ) : items && items.length > 0 ? (
          items.map((it) => (
            <Card key={it.id ?? it.productId} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{it.titleAr ?? it.titleEn ?? it.slug}</div>
                  <div className="text-sm text-muted-foreground">{it.basePrice ? `${it.basePrice} ${it.currencyCode ?? ''}` : "سعر غير متوفر"}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" onClick={() => router.push(`/products/${it.productId ?? it.id}`)}>عرض</Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-muted-foreground">لا توجد منتجات في هذه المجموعة</div>
        )}
      </div>
    </div>
  )
}
