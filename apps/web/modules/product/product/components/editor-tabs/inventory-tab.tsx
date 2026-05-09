"use client"

import dynamic from "next/dynamic"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

type Props = {
  productId: string
  isEdit: boolean
}

// Lazy-load the heavy inventory table — many sub-queries, large bundle
const ProductInventoryPage = dynamic(
  () =>
    import("@/modules/inventory/components/product-inventory-page").then(
      (mod) => mod.default
    ),
  {
    loading: () => (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    ),
    ssr: false,
  }
)

/**
 * Inventory tab — Phase 2: lazy-loads the existing per-product inventory page.
 * Phase 3C will add: threshold inline editor, bulk adjust modal trigger,
 * and movement history drawer per variant row.
 */
export default function InventoryTab({ productId, isEdit }: Props) {
  if (!isEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">المخزون</CardTitle>
          <CardDescription>
            احفظ المنتج أولاً قبل إدارة المخزون والمتغيّرات.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            بعد إنشاء المنتج وحفظ متغيّراته، ستتمكّن من ضبط الكميّات وحدود
            التنبيه من هنا.
          </p>
        </CardContent>
      </Card>
    )
  }

  // ProductInventoryPage reads productId via useParams() internally — same route
  // (/products/[product-id]) so it works embedded as a tab. The `productId` prop
  // here is intentionally unused but kept in the signature for future refactor
  // when ProductInventoryPage accepts it explicitly.
  void productId

  return (
    <div className="flex flex-col gap-4">
      <ProductInventoryPage />
    </div>
  )
}
