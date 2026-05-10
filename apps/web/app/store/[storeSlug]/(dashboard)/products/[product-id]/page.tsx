"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@workspace/ui/components/button"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/system/tabs"
import { initProduct } from "@/modules/product/product/init"
import { productSchema } from "@/modules/product/product/schema"
import {
  createProduct,
  getProduct,
  updateProduct,
} from "@/modules/product/product/actions"
import { productKeys } from "@/modules/product/product/queryKeys"
import { useProductDraft } from "@/modules/product/product/hooks/use-product-draft"
import { variantQueryKeys } from "@/modules/product/variant/queryKeys"
import { inventoryQueryKeys } from "@/modules/inventory/queryKeys"
import type { ImageUploaderState } from "@/components/system/image-uploader"

import BasicsTab from "@/modules/product/product/components/editor-tabs/basics-tab"
import CategorizationTab from "@/modules/product/product/components/editor-tabs/categorization-tab"
import MediaTab from "@/modules/product/product/components/editor-tabs/media-tab"
import VariantsTab from "@/modules/product/product/components/editor-tabs/variants-tab"
import InventoryTab from "@/modules/product/product/components/editor-tabs/inventory-tab"
import SeoTab from "@/modules/product/product/components/editor-tabs/seo-tab"
import AttributesTab from "@/modules/product/product/components/editor-tabs/attributes-tab"

type ProductFormInput = z.input<typeof productSchema>
type ProductSubmitValues = z.output<typeof productSchema>

const VALID_TABS = [
  "basics",
  "categorization",
  "media",
  "variants",
  "inventory",
  "seo",
  "attributes",
] as const

type TabValue = (typeof VALID_TABS)[number]

const isValidTab = (value: string | null): value is TabValue =>
  value !== null && (VALID_TABS as readonly string[]).includes(value)

export default function ProductDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const productId = params?.["product-id"]?.toString() ?? ""
  const isEdit = productId !== "create"

  const tabFromUrl = searchParams?.get("tab") ?? null
  const activeTab: TabValue = isValidTab(tabFromUrl) ? tabFromUrl : "basics"

  const handleTabChange = useCallback(
    (next: string) => {
      const url = new URL(window.location.href)
      if (next === "basics") {
        url.searchParams.delete("tab")
      } else {
        url.searchParams.set("tab", next)
      }
      router.replace(`${url.pathname}${url.search}`, { scroll: false })
    },
    [router]
  )

  const queryClient = useQueryClient()

  const form = useForm<ProductFormInput, unknown, ProductSubmitValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initProduct(),
  })

  const { data: product, isLoading } = useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => getProduct(productId),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!isEdit) {
      form.reset(initProduct())
      return
    }

    if (!product) return

    form.reset(initProduct(product))
  }, [form, isEdit, product])

  // NFR-UX-006: auto-save form values to localStorage every 30s + restore prompt on mount
  const draft = useProductDraft({
    productId: isEdit ? productId : "new",
    form,
    enabled: !isLoading,
  })

  // After product save we must refresh:
  //  - the detail query (so basics/SEO/options reflect server-side changes,
  //    e.g. options regenerated via the upsert)
  //  - the variant matrix (saving the product can mutate axes / variants)
  //  - the inventory status (variant changes ripple to per-product status)
  //  - the global product list (title / status / image flips show there too)
  const invalidateProductCaches = useCallback(() => {
    if (productId) {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) })
      queryClient.invalidateQueries({
        queryKey: variantQueryKeys.matrix(productId),
      })
      queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.status(productId),
      })
    }
    queryClient.invalidateQueries({ queryKey: productKeys.all })
  }, [queryClient, productId])

  const { isPending: isUpdating, mutate: updateProductMutation } = useMutation({
    mutationKey: ["update-product"],
    mutationFn: updateProduct,
    onSuccess: () => {
      draft.clear()
      invalidateProductCaches()
    },
  })

  const { isPending: isCreating, mutate: createProductMutation } = useMutation({
    mutationKey: ["create-product"],
    mutationFn: createProduct,
    onSuccess: () => {
      draft.clear()
      invalidateProductCaches()
    },
  })

  const handleSubmit = useCallback(
    (data: ProductSubmitValues) => {
      if (isEdit) {
        if (!productId) return
        updateProductMutation({ id: productId, data })
        return
      }

      createProductMutation(data)
    },
    [createProductMutation, isEdit, productId, updateProductMutation]
  )

  const isSubmitting = isUpdating || isLoading || isCreating

  const handleImageChange = useCallback(
    ({ keptExistingIds, newFiles }: ImageUploaderState) => {
      // Server-known IDs the user wants to keep, in display order.
      // Server PREPENDS uploaded file UUIDs to this list.
      form.setValue("mediaAssetIds", keptExistingIds, {
        shouldDirty: true,
        shouldValidate: false,
      })
      form.setValue("mediaFiles", newFiles, {
        shouldDirty: true,
        shouldValidate: false,
      })
    },
    [form]
  )

  const existingMedia = useMemo(() => {
    if (!isEdit || !product?.mediaAssetIds || !product?.mediaUrls) return []
    return product.mediaAssetIds.map((id, i) => ({
      id,
      url: product.mediaUrls?.[i] ?? "",
    }))
  }, [isEdit, product])

  return (
    <div className="container my-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="page-title">
          {isEdit ? "تفاصيل المنتج" : "إضافة منتج"}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button type="submit" form="product-form" disabled={isSubmitting}>
            حفظ
          </Button>
        </div>
      </div>

      <FormProvider {...form}>
        <form
          id="product-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="self-start">
              <TabsTrigger value="basics">الأساسي</TabsTrigger>
              <TabsTrigger value="categorization">الفئات والوسوم</TabsTrigger>
              <TabsTrigger value="media">الصور</TabsTrigger>
              <TabsTrigger value="variants">الخيارات والمتغيّرات</TabsTrigger>
              <TabsTrigger value="inventory" disabled={!isEdit}>
                المخزون
              </TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="attributes">السمات</TabsTrigger>
            </TabsList>

            <TabsContent value="basics">
              <BasicsTab isSubmitting={isSubmitting} />
            </TabsContent>

            <TabsContent value="categorization">
              <CategorizationTab isSubmitting={isSubmitting} />
            </TabsContent>

            <TabsContent value="media">
              <MediaTab
                isSubmitting={isSubmitting}
                existing={existingMedia}
                onChange={handleImageChange}
              />
            </TabsContent>

            <TabsContent value="variants">
              <VariantsTab
                isSubmitting={isSubmitting}
                productId={productId}
                isEdit={isEdit}
              />
            </TabsContent>

            <TabsContent value="inventory">
              <InventoryTab productId={productId} isEdit={isEdit} />
            </TabsContent>

            <TabsContent value="seo">
              <SeoTab isSubmitting={isSubmitting} />
            </TabsContent>

            <TabsContent value="attributes">
              <AttributesTab isSubmitting={isSubmitting} />
            </TabsContent>
          </Tabs>
        </form>
      </FormProvider>
    </div>
  )
}
