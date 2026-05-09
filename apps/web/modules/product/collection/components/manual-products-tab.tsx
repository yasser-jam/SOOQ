"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import {
  addCollectionProduct,
  listCollectionProducts,
  removeCollectionProduct,
  reorderCollectionProducts,
} from "@/modules/product/collection/actions"
import { collectionQueryKeys } from "@/modules/product/collection/queryKeys"

type Props = {
  collectionId: string
}

export default function ManualProductsTab({ collectionId }: Props) {
  const queryClient = useQueryClient()
  const [productIdToAdd, setProductIdToAdd] = useState("")

  const { data: products, isPending } = useQuery({
    queryKey: collectionQueryKeys.products(collectionId, 0),
    queryFn: () => listCollectionProducts(collectionId, { page: 0, size: 100 }),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: collectionQueryKeys.products(collectionId, 0),
    })

  const { mutate: addProduct, isPending: isAdding } = useMutation({
    mutationFn: () =>
      addCollectionProduct(collectionId, {
        productId: productIdToAdd.trim(),
        sortOrder: products?.length ?? 0,
      }),
    onSuccess: () => {
      toast.success("تم إضافة المنتج للمجموعة")
      setProductIdToAdd("")
      invalidate()
    },
  })

  const { mutate: removeProduct } = useMutation({
    mutationFn: (productId: string) =>
      removeCollectionProduct(collectionId, productId),
    onSuccess: () => {
      toast.success("تم إزالة المنتج")
      invalidate()
    },
  })

  const { mutate: reorder } = useMutation({
    mutationFn: (productIds: string[]) =>
      reorderCollectionProducts(collectionId, productIds),
    onSuccess: () => {
      toast.success("تم تحديث الترتيب")
      invalidate()
    },
  })

  const move = (index: number, direction: -1 | 1) => {
    if (!products) return
    const next = [...products]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    const tmp = next[index]!
    next[index] = next[target]!
    next[target] = tmp
    reorder(next.map((p) => p.productId))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label
            htmlFor="add-product-id"
            className="block text-sm font-medium mb-1"
          >
            إضافة منتج بالـ productId
          </label>
          <Input
            id="add-product-id"
            value={productIdToAdd}
            onChange={(e) => setProductIdToAdd(e.target.value)}
            placeholder="UUID"
            dir="ltr"
            disabled={isAdding}
          />
        </div>
        <Button
          type="button"
          onClick={() => addProduct()}
          disabled={!productIdToAdd.trim() || isAdding}
        >
          {isAdding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          إضافة
        </Button>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>
      ) : !products || products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            لا توجد منتجات في هذه المجموعة بعد. أضف منتجاً من الحقل أعلاه.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {products.map((p, index) => (
            <li
              key={p.productId}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <Badge variant="secondary" className="font-mono">
                {index + 1}
              </Badge>
              {p.primaryImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.primaryImageUrl}
                  alt=""
                  className="size-10 rounded object-cover"
                />
              ) : null}
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="font-medium text-sm">
                  {p.titleAr ?? p.titleEn ?? p.productId}
                </span>
                {p.displayPrice ? (
                  <span className="text-xs text-muted-foreground">
                    {p.displayPrice}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => move(index, 1)}
                  disabled={index === products.length - 1}
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeProduct(p.productId)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
