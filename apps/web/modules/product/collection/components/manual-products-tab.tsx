"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import ImgPreview from "@/components/system/img-preview"
import MultiSelect from "@/components/system/multi-select"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import {
  addCollectionProduct,
  listCollectionProducts,
  removeCollectionProduct,
  reorderCollectionProducts,
} from "@/modules/product/collection/actions"
import { collectionQueryKeys } from "@/modules/product/collection/queryKeys"
import { listProducts } from "@/modules/product/product/actions"
import { productKeys } from "@/modules/product/product/queryKeys"

type Props = {
  collectionId: string
}

export default function ManualProductsTab({ collectionId }: Props) {
  const queryClient = useQueryClient()
  const [productIdsToAdd, setProductIdsToAdd] = useState<string[]>([])

  const { data: products, isPending } = useQuery({
    queryKey: collectionQueryKeys.products(collectionId, 0),
    queryFn: () => listCollectionProducts(collectionId, { page: 0, size: 100 }),
    enabled: Boolean(collectionId),
  })

  const { data: catalogResponse, isPending: isLoadingCatalog } = useQuery({
    queryKey: productKeys.all,
    queryFn: listProducts,
  })
  const catalogProducts = catalogResponse?.data ?? []

  const alreadyInCollectionIds = useMemo(
    () => new Set((products ?? []).map((p) => p.productId)),
    [products]
  )

  const draftCount = catalogProducts.filter((p) => p.status === "DRAFT").length
  const availableProducts = useMemo(
    () =>
      catalogProducts.filter(
        (p) =>
          p.id && p.status === "ACTIVE" && !alreadyInCollectionIds.has(p.id)
      ),
    [catalogProducts, alreadyInCollectionIds]
  )

  const pickerItems = useMemo(
    () =>
      availableProducts.map((product) => ({
        id: product.id!,
        title: product.titleAr || product.titleEn || product.slug,
      })),
    [availableProducts]
  )

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: collectionQueryKeys.products(collectionId, 0),
    })

  const { mutate: addProducts, isPending: isAdding } = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((productId) =>
          addCollectionProduct(collectionId, { productId })
        )
      )
    },
    onSuccess: (_, ids) => {
      toast.success(
        ids.length === 1
          ? "تم إضافة المنتج للمجموعة"
          : `تم إضافة ${ids.length} منتجات للمجموعة`
      )
      setProductIdsToAdd([])
      invalidate()
    },
  })

  const { mutate: removeProduct, isPending: isRemoving } = useMutation({
    mutationFn: (productId: string) =>
      removeCollectionProduct(collectionId, productId),
    onSuccess: () => {
      toast.success("تم إزالة المنتج")
      invalidate()
    },
  })

  const { mutate: reorder, isPending: isReordering } = useMutation({
    mutationFn: (productIds: string[]) =>
      reorderCollectionProducts(collectionId, productIds),
    onSuccess: () => {
      toast.success("تم تحديث الترتيب")
      invalidate()
    },
  })

  const move = (index: number, direction: -1 | 1) => {
    if (!products || isReordering) return
    const next = [...products]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    const tmp = next[index]!
    next[index] = next[target]!
    next[target] = tmp
    reorder(next.map((p) => p.productId))
  }

  const handleAdd = () => {
    if (productIdsToAdd.length === 0) return
    addProducts(productIdsToAdd)
  }

  const isBusy = isAdding || isRemoving || isReordering

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="add-products"
              className="mb-1.5 block text-sm font-medium"
            >
              إضافة منتجات
            </label>
            <MultiSelect
              items={pickerItems}
              itemTitle="title"
              itemValue="id"
              value={productIdsToAdd}
              onChange={setProductIdsToAdd}
              placeholder={
                isLoadingCatalog
                  ? "جارٍ تحميل المنتجات..."
                  : availableProducts.length === 0
                    ? "لا توجد منتجات متاحة للإضافة"
                    : "اختر منتجاً أو أكثر"
              }
              loading={isLoadingCatalog}
            />
            {!isLoadingCatalog && draftCount > 0 ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                منتجات بحالة "مسودة" غير معروضة هنا — انشرها أوّلاً لتتمكن من
                إضافتها للمجموعة.
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={productIdsToAdd.length === 0 || isAdding || isBusy}
            className="shrink-0"
          >
            {isAdding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {productIdsToAdd.length > 1
              ? `إضافة ${productIdsToAdd.length} منتجات`
              : "إضافة"}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">منتجات المجموعة</p>
        {!isPending && products && products.length > 0 ? (
          <Badge variant="secondary">{products.length} منتج</Badge>
        ) : null}
      </div>

      {isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : !products || products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Package className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">لا توجد منتجات بعد</p>
          <p className="mt-1 text-sm text-muted-foreground">
            اختر منتجاً أو أكثر من القائمة أعلاه لإضافته إلى المجموعة.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {products.map((p, index) => (
            <li
              key={p.productId}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
            >
              <Badge variant="outline" className="min-w-8 justify-center font-mono">
                {index + 1}
              </Badge>
              <ImgPreview
                url={p.primaryImageUrl}
                alt=""
                className="size-12 rounded-md object-cover"
                fallback={
                  <div className="flex size-12 items-center justify-center rounded-md bg-muted">
                    <Package className="size-5 text-muted-foreground" />
                  </div>
                }
              />
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {p.titleAr ?? p.titleEn ?? p.productId}
                </span>
                {p.displayPrice ? (
                  <span className="text-xs text-muted-foreground">
                    {p.displayPrice}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || isBusy}
                  aria-label="تحريك لأعلى"
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => move(index, 1)}
                  disabled={index === products.length - 1 || isBusy}
                  aria-label="تحريك لأسفل"
                >
                  <ChevronDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeProduct(p.productId)}
                  disabled={isBusy}
                  aria-label="إزالة المنتج"
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
