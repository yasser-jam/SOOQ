"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  addCollectionProduct,
  listCollectionProducts,
  removeCollectionProduct,
  reorderCollectionProducts,
} from "@/modules/product/collection/actions"
import { collectionQueryKeys } from "@/modules/product/collection/queryKeys"
import { listProducts } from "@/modules/product/product/actions"
import { productKeys } from "@/modules/product/product/queryKeys"

// Mock data for development (backend is down)
const MOCK_PRODUCTS = [
  {
    id: "mock-product-1",
    productId: "mock-product-1",
    titleAr: "ساعة ذكية",
    titleEn: "Smart Watch",
    slug: "smart-watch",
    status: "ACTIVE",
    primaryImageUrl: "https://via.placeholder.com/40",
    displayPrice: "500 ر.س",
  },
  {
    id: "mock-product-2",
    productId: "mock-product-2",
    titleAr: "سماعات لاسلكية",
    titleEn: "Wireless Headphones",
    slug: "wireless-headphones",
    status: "ACTIVE",
    primaryImageUrl: "https://via.placeholder.com/40",
    displayPrice: "300 ر.س",
  },
  {
    id: "mock-product-3",
    productId: "mock-product-3",
    titleAr: "شاحن سريع",
    titleEn: "Fast Charger",
    slug: "fast-charger",
    status: "ACTIVE",
    primaryImageUrl: "https://via.placeholder.com/40",
    displayPrice: "150 ر.س",
  },
]

const MOCK_COLLECTION_PRODUCTS = [
  {
    productId: "mock-product-1",
    titleAr: "ساعة ذكية",
    titleEn: "Smart Watch",
    primaryImageUrl: "https://via.placeholder.com/40",
    displayPrice: "500 ر.س",
  },
]

type Props = {
  collectionId: string
}

export default function ManualProductsTab({ collectionId }: Props) {
  const queryClient = useQueryClient()
  const [productIdToAdd, setProductIdToAdd] = useState("")

  // Mock data for development (backend is down)
  const { data: products, isPending } = useQuery({
    queryKey: collectionQueryKeys.products(collectionId, 0),
    queryFn: async () => {
      // Return mock data instead of calling backend
      if (collectionId === "mock-collection-1") {
        return MOCK_COLLECTION_PRODUCTS
      }
      return []
    },
    enabled: false, // Disable backend query
  })

  // Catalog: full product list to populate the picker. Mock data for development.
  const { data: catalogResponse, isPending: isLoadingCatalog } = useQuery({
    queryKey: productKeys.all,
    queryFn: async () => {
      // Return mock data instead of calling backend
      return { data: MOCK_PRODUCTS }
    },
    enabled: false, // Disable backend query
  })
  const catalogProducts = catalogResponse?.data ?? MOCK_PRODUCTS

  // Hide products that are already in this collection so the merchant can't
  // pick a duplicate (the backend would reject it anyway).
  const alreadyInCollectionIds = useMemo(
    () => new Set((products ?? []).map((p) => p.productId)),
    [products]
  )
  // The admin collection-products endpoint filters by `status = ACTIVE`
  // (CollectionService.getProductsRaw in SOOQ-Back), so a DRAFT product gets
  // saved into the join table but never appears in the list — a UX dead-end
  // (can't see, can't remove from this screen). Filter the picker to ACTIVE
  // products only and surface a hint about it in the empty state.
  const draftCount = catalogProducts.filter((p) => p.status === "DRAFT").length
  const availableProducts = useMemo(
    () =>
      catalogProducts.filter(
        (p) =>
          p.id &&
          p.status === "ACTIVE" &&
          !alreadyInCollectionIds.has(p.id)
      ),
    [catalogProducts, alreadyInCollectionIds]
  )

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: collectionQueryKeys.products(collectionId, 0),
    })

  // Mock mutations for development (backend is down)
  const { mutate: addProduct, isPending: isAdding } = useMutation({
    mutationFn: async () => {
      // Mock add - just return success
      console.log("Mock add product to collection:", productIdToAdd)
      return new Promise((resolve) => setTimeout(resolve, 500))
    },
    onSuccess: () => {
      toast.success("تم إضافة المنتج للمجموعة")
      setProductIdToAdd("")
      invalidate()
    },
  })

  const { mutate: removeProduct } = useMutation({
    mutationFn: async (productId: string) => {
      // Mock remove - just return success
      console.log("Mock remove product from collection:", productId)
      return new Promise((resolve) => setTimeout(resolve, 500))
    },
    onSuccess: () => {
      toast.success("تم إزالة المنتج")
      invalidate()
    },
  })

  const { mutate: reorder } = useMutation({
    mutationFn: async (productIds: string[]) => {
      // Mock reorder - just return success
      console.log("Mock reorder products:", productIds)
      return new Promise((resolve) => setTimeout(resolve, 500))
    },
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
            إضافة منتج
          </label>
          <Select
            value={productIdToAdd}
            onValueChange={setProductIdToAdd}
            disabled={isAdding || isLoadingCatalog}
          >
            <SelectTrigger id="add-product-id" className="w-full">
              <SelectValue
                placeholder={
                  isLoadingCatalog
                    ? "جارٍ تحميل المنتجات..."
                    : availableProducts.length === 0
                      ? "لا توجد منتجات متاحة للإضافة"
                      : "اختر منتجاً"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableProducts.map((product) => (
                <SelectItem key={product.id} value={product.id ?? ""}>
                  {product.titleAr || product.titleEn || product.slug}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isLoadingCatalog && draftCount > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              منتجات بحالة "مسودة" غير معروضة هنا — انشرها أوّلاً لتتمكن من
              إضافتها للمجموعة.
            </p>
          ) : null}
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
            لا توجد منتجات في هذه المجموعة بعد. اختر منتجاً من القائمة أعلاه.
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
