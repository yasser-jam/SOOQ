"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, useForm, type Path } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { ApiError } from "@/lib/api"

import { initProduct } from "@/modules/product/product/init"
import { productSchema } from "@/modules/product/product/schema"
import {
  createProduct,
  getProduct,
  updateProduct,
} from "@/modules/product/product/actions"
import { productKeys } from "@/modules/product/product/queryKeys"
import { useProductDraft } from "@/modules/product/product/hooks/use-product-draft"
import { inventoryQueryKeys } from "@/modules/inventory/queryKeys"
import type { ImageUploaderState } from "@/components/system/image-uploader"

import BasicInfoSection from "@/modules/product/product/components/editor-tabs/basic-info-section"
import PricingSection from "@/modules/product/product/components/editor-tabs/pricing-section"
import CategorizationSection from "@/modules/product/product/components/editor-tabs/categorization-section"
import MediaTab from "@/modules/product/product/components/editor-tabs/media-tab"
import VariantsTab from "@/modules/product/product/components/editor-tabs/variants-tab"
import InventoryTab from "@/modules/product/product/components/editor-tabs/inventory-tab"
import SeoTab from "@/modules/product/product/components/editor-tabs/seo-tab"
import AttributesTab from "@/modules/product/product/components/editor-tabs/attributes-tab"
import ProductSidebarNavigation from "@/modules/product/product/components/product-sidebar-navigation"

type ProductFormInput = z.input<typeof productSchema>
type ProductSubmitValues = z.output<typeof productSchema>

const PRODUCT_FIELD_ALIASES: Record<string, Path<ProductFormInput>> = {
  slug: "slug",
  title_ar: "titleAr",
  titleAr: "titleAr",
  title_en: "titleEn",
  titleEn: "titleEn",
}

const SECTION_IDS = [
  "basic-info",
  "media",
  "pricing-inventory",
  "variants",
  "categorization-attributes",
  "seo",
] as const

export default function ProductDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params?.["product-id"]?.toString() ?? ""
  const isEdit = productId !== "create"
  const productsListPath = `/products`

  const [activeSection, setActiveSection] = useState<string>("basic-info")
  const formScrollRef = useRef<HTMLDivElement>(null)

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

  const draft = useProductDraft({
    productId: isEdit ? productId : "new",
    form,
    enabled: !isLoading,
  })

  // Scroll-spy: track the topmost section visible in the form scroll area
  useEffect(() => {
    const root = formScrollRef.current
    if (!root) return

    const visible = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visible.add(entry.target.id)
          } else {
            visible.delete(entry.target.id)
          }
        })
        const first = SECTION_IDS.find((id) => visible.has(id))
        if (first) setActiveSection(first)
      },
      { root, rootMargin: "0px 0px -50% 0px", threshold: 0 }
    )

    SECTION_IDS.forEach((id) => {
      const el = root.querySelector<HTMLElement>(`#${id}`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const invalidateProductCaches = useCallback(() => {
    if (productId) {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) })
      queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.status(productId),
      })
    }
    queryClient.invalidateQueries({ queryKey: productKeys.all })
  }, [queryClient, productId])

  const handleMutationError = useCallback(
    (error: ApiError) => {
      if (error.action === "show-field-error" && error.fieldKey) {
        const formField =
          PRODUCT_FIELD_ALIASES[error.fieldKey] ??
          (error.fieldKey as Path<ProductFormInput>)
        form.setError(formField, {
          type: "server",
          message: error.message,
        })
        toast.error(error.message)
      }
    },
    [form]
  )

  const { isPending: isUpdating, mutate: updateProductMutation } = useMutation({
    mutationKey: ["update-product"],
    mutationFn: updateProduct,
    onSuccess: () => {
      draft.clear()
      invalidateProductCaches()
      toast.success("تم حفظ المنتج")
      router.push(productsListPath)
    },
    onError: handleMutationError,
  })

  const { isPending: isCreating, mutate: createProductMutation } = useMutation({
    mutationKey: ["create-product"],
    mutationFn: createProduct,
    onSuccess: () => {
      draft.clear()
      invalidateProductCaches()
      toast.success("تم إنشاء المنتج")
      router.push(productsListPath)
    },
    onError: handleMutationError,
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
    // Fill the inset below the dashboard header (h-16) so only the form column scrolls
    <div className="container flex h-[calc(100svh-4rem)] flex-col gap-6 overflow-hidden py-6">
      <div className="flex shrink-0 items-center justify-between">
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

      <div className="relative flex min-h-0 flex-1 gap-6">
        <ProductSidebarNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          scrollContainerRef={formScrollRef}
          sectionValidation={{}}
        />

        <div
          ref={formScrollRef}
          className={[
            "min-h-0 flex-1 overflow-y-auto pe-1",
            // Thin light-gray scrollbar (same as DialogContent)
            "[scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]",
            "**:[scrollbar-width:thin] **:[scrollbar-color:var(--border)_transparent]",
            "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border",
            "[&_*::-webkit-scrollbar]:h-1.5 [&_*::-webkit-scrollbar]:w-1.5",
            "[&_*::-webkit-scrollbar-track]:bg-transparent",
            "[&_*::-webkit-scrollbar-thumb]:rounded-full [&_*::-webkit-scrollbar-thumb]:bg-border",
          ].join(" ")}
        >
          <FormProvider {...form}>
            <form
              id="product-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6 pb-6"
            >
              <section id="basic-info" className="scroll-mt-2">
                <BasicInfoSection isSubmitting={isSubmitting} isEdit={isEdit} />
              </section>

              <section id="media" className="scroll-mt-2">
                <MediaTab
                  isSubmitting={isSubmitting}
                  existing={existingMedia}
                  onChange={handleImageChange}
                />
              </section>

              <section id="pricing-inventory" className="scroll-mt-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>التسعير</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PricingSection isSubmitting={isSubmitting} />
                  </CardContent>
                </Card>

                {/* {isEdit && (
                  <Card>
                    <CardHeader className="border-b">
                      <CardTitle>المخزون</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <InventoryTab productId={productId} isEdit={isEdit} />
                    </CardContent>
                  </Card>
                )} */}
              </section>

              <section id="variants" className="scroll-mt-2">
                <VariantsTab
                  isSubmitting={isSubmitting}
                  productId={productId}
                />
              </section>

              <section id="categorization-attributes" className="scroll-mt-2">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>التصنيف</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CategorizationSection isSubmitting={isSubmitting} />
                    </CardContent>
                  </Card>

                  <AttributesTab isSubmitting={isSubmitting} />
                </div>
              </section>

              <section id="seo" className="scroll-mt-2">
                <SeoTab isSubmitting={isSubmitting} />
              </section>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  )
}
