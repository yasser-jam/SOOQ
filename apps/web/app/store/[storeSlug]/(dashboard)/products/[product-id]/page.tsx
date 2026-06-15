"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, useForm, type Path } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@workspace/ui/components/button"

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

// Map a backend `fieldErrors[].field` (often dotted or snake_case) to the form
// path used by react-hook-form. Falls back to the raw key. Surfaced via
// `form.setError` so the field highlights inline.
const PRODUCT_FIELD_ALIASES: Record<string, Path<ProductFormInput>> = {
  slug: "slug",
  title_ar: "titleAr",
  titleAr: "titleAr",
  title_en: "titleEn",
  titleEn: "titleEn",
}

export default function ProductDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const storeSlug = params?.storeSlug?.toString() ?? ""
  const productId = params?.["product-id"]?.toString() ?? ""
  const isEdit = productId !== "create"
  const productsListPath = `/store/${storeSlug}/products`

  const [activeSection, setActiveSection] = useState("basic-info")
  const [isSeoExpanded, setIsSeoExpanded] = useState(false)

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
  //  - the detail query (so basics/SEO/options/variants reflect server-side
  //    changes, e.g. variants regenerated via the upsert)
  //  - the inventory status (variant changes ripple to per-product status)
  //  - the global product list (title / status / image flips show there too)
  const invalidateProductCaches = useCallback(() => {
    if (productId) {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) })
      queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.status(productId),
      })
    }
    queryClient.invalidateQueries({ queryKey: productKeys.all })
  }, [queryClient, productId])

  // Surface backend validation errors (e.g. duplicate slug → ERR_1003) on
  // the actual field instead of letting them disappear silently. The axios
  // interceptor already suppresses the toast for `show-field-error`, so we
  // emit a brief toast here too.
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
    <div className="container my-6 flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="page-title" style={{ color: "#122640" }}>
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
          <Button
            type="submit"
            form="product-form"
            disabled={isSubmitting}
            style={{ backgroundColor: "#BA7B1B" }}
          >
            حفظ
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        <ProductSidebarNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          sectionValidation={{}}
        />

        <div className="flex-1 space-y-6">
          <FormProvider {...form}>
            <form
              id="product-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <section id="basic-info" className="scroll-mt-6">
                <BasicInfoSection isSubmitting={isSubmitting} />
              </section>

              <section id="media" className="scroll-mt-6">
                <MediaTab
                  isSubmitting={isSubmitting}
                  existing={existingMedia}
                  onChange={handleImageChange}
                />
              </section>

              <section id="pricing-inventory" className="scroll-mt-6 space-y-6">
                <div className="border-2 rounded-lg p-6 bg-white" style={{ borderColor: "#E5E7EB" }}>
                  <h3 className="text-xl font-bold mb-4" style={{ color: "#122640" }}>
                    التسعير
                  </h3>
                  <PricingSection isSubmitting={isSubmitting} />
                </div>

                {isEdit && (
                  <div className="border-2 rounded-lg p-6 bg-white" style={{ borderColor: "#E5E7EB" }}>
                    <h3 className="text-xl font-bold mb-4" style={{ color: "#122640" }}>
                      المخزون
                    </h3>
                    <InventoryTab productId={productId} isEdit={isEdit} />
                  </div>
                )}
              </section>

              <section id="variants" className="scroll-mt-6">
                <VariantsTab
                  isSubmitting={isSubmitting}
                  productId={productId}
                />
              </section>

              <section id="categorization-attributes" className="scroll-mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="border-2 rounded-lg p-6 bg-white" style={{ borderColor: "#E5E7EB" }}>
                    <h3 className="text-xl font-bold mb-4" style={{ color: "#122640" }}>
                      التصنيف
                    </h3>
                    <CategorizationSection isSubmitting={isSubmitting} />
                  </div>

                  <div className="border-2 rounded-lg p-6 bg-white" style={{ borderColor: "#E5E7EB" }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: "#122640" }}>
                      الخصائص المتقدمة
                    </h3>
                    <AttributesTab isSubmitting={isSubmitting} />
                  </div>
                </div>
              </section>

              <section id="seo" className="scroll-mt-6">
                <div className="border-2 rounded-lg bg-white" style={{ borderColor: "#E5E7EB" }}>
                  <button
                    type="button"
                    onClick={() => setIsSeoExpanded(!isSeoExpanded)}
                    className="w-full flex items-center justify-between p-6 text-right border-b"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <h3 className="text-xl font-bold" style={{ color: "#122640" }}>
                      إعدادات SEO
                    </h3>
                    {isSeoExpanded ? (
                      <ChevronUp style={{ color: "#122640" }} />
                    ) : (
                      <ChevronDown style={{ color: "#122640" }} />
                    )}
                  </button>
                  {isSeoExpanded && (
                    <div className="p-6">
                      <SeoTab isSubmitting={isSubmitting} />
                    </div>
                  )}
                </div>
              </section>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  )
}
