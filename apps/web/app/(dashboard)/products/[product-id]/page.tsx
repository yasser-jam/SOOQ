"use client"

import { useState, useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"
import { Plus, Trash2Icon } from "lucide-react"
import { z } from "zod"

import Field from "@/components/system/Field"
import { initProduct } from "@/modules/product/product/init"
import { productSchema } from "@/modules/product/product/schema"
import VariantOptionDialog from "@/modules/product/product/components/option-dialog"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"

import {
  createProduct,
  getProduct,
  updateProduct,
} from "@/modules/product/product/actions"
import CurrencySelect from "@/modules/product/product/components/currency-select"
import ProductMultipleCategorySelect from "@/modules/product/category/components/multiple-category-select"
import StatusSelect from "@/modules/product/product/components/status-select"
import Textarea from "@/components/system/textarea"
import CategorySelect from "@/modules/product/category/components/select"
import TagMultiSelect from "@/modules/product/tag/components/multi-select"
import { normalizeOptionSortOrder } from "@/modules/product/product/helpers"
import ImageUploader from "@/components/system/image-uploader"

type ProductFormInput = z.input<typeof productSchema>
type ProductSubmitValues = z.output<typeof productSchema>

export default function ProductDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params?.["product-id"]?.toString() ?? ""
  const isEdit = productId !== "create"

  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false)

  const form = useForm<ProductFormInput, unknown, ProductSubmitValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initProduct(),
  })

  const { data: product, isLoading } = useQuery({
    queryKey: ["products", productId],
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

  const { isPending: isUpdating, mutate: updateProductMutation } = useMutation({
    mutationKey: ["update-product"],
    mutationFn: updateProduct,
  })

  const { isPending: isCreating, mutate: createProductMutation } = useMutation({
    mutationKey: ["create-product"],
    mutationFn: createProduct,
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
  const productOptions =
    useWatch({
      control: form.control,
      name: "options",
    }) ?? []

  const handleImageChange = useCallback(
    (imageUrls: string[]) => {
      form.setValue("mediaUrls", imageUrls, {
        shouldDirty: true,
        shouldValidate: true,
      })
    },
    [form]
  )

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

      <form
        id="product-form"
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-2xl">معلومات أساسية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  name="titleAr"
                  control={form.control}
                  label="العنوان بالعربية"
                  placeholder="أدخل العنوان بالعربية"
                  inputProps={{ disabled: isSubmitting }}
                />

                <Field
                  name="titleEn"
                  control={form.control}
                  label="العنوان بالإنجليزية"
                  placeholder="أدخل العنوان بالإنجليزية"
                  inputProps={{ disabled: isSubmitting }}
                />

                <Field
                  name="slug"
                  control={form.control}
                  label="الرابط"
                  placeholder="أدخل رابط المنتج"
                  inputProps={{ disabled: isSubmitting }}
                />

                <UiField data-invalid={Boolean(form.formState.errors.status)}>
                  <FieldLabel htmlFor="status">الحالة</FieldLabel>
                  <Controller
                    name="status"
                    control={form.control}
                    render={({ field }) => (
                      <StatusSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  <FieldError errors={[form.formState.errors.status]} />
                </UiField>

                <Textarea
                  name="descriptionAr"
                  control={form.control}
                  label="الوصف بالعربية"
                  placeholder="أدخل الوصف بالعربية"
                  textareaProps={{ disabled: isSubmitting }}
                />

                <Textarea
                  name="descriptionEn"
                  control={form.control}
                  label="الوصف بالإنجليزية"
                  placeholder="أدخل الوصف بالإنجليزية"
                  textareaProps={{ disabled: isSubmitting }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-2xl">التسعير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <Field
                  name="basePrice"
                  control={form.control}
                  label="السعر الأساسي"
                  inputProps={{
                    disabled: isSubmitting,
                    type: "number",
                    min: 0,
                  }}
                />

                <Field
                  name="compareAtPrice"
                  control={form.control}
                  label="سعر المقارنة"
                  inputProps={{
                    disabled: isSubmitting,
                    type: "number",
                    min: 0,
                  }}
                />

                <UiField
                  data-invalid={Boolean(form.formState.errors.currencyCode)}
                >
                  <FieldLabel htmlFor="currencyCode">العملة</FieldLabel>
                  <Controller
                    name="currencyCode"
                    control={form.control}
                    render={({ field }) => (
                      <CurrencySelect
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  <FieldError errors={[form.formState.errors.currencyCode]} />
                </UiField>

                <UiField
                  data-invalid={Boolean(form.formState.errors.allowOversell)}
                  className="rounded-lg border p-4"
                >
                  <FieldLabel
                    htmlFor="allowOversell"
                    className="flex w-full items-center gap-3"
                  >
                    <input
                      id="allowOversell"
                      type="checkbox"
                      {...form.register("allowOversell")}
                      disabled={isSubmitting}
                      className="size-4"
                    />
                    <div className="flex flex-col gap-1">
                      <span>السماح بالبيع عند نفاد المخزون</span>
                    </div>
                  </FieldLabel>
                  <FieldError errors={[form.formState.errors.allowOversell]} />
                </UiField>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 xl:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">الفئات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <CategorySelect
                  name="defaultCategoryId"
                  control={form.control}
                  label="الفئة الافتراضية"
                  placeholder="اختر الفئة الافتراضية"
                  disabled={isSubmitting}
                />

                <ProductMultipleCategorySelect
                  name="categoryIds"
                  control={form.control}
                  label="الفئات"
                  placeholder="اختر الفئات"
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          {isEdit && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">صور المنتج</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUploader onChange={handleImageChange} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">الوسوم</CardTitle>
            </CardHeader>
            <CardContent>
              <TagMultiSelect
                control={form.control}
                name="tagIds"
                label="الوسوم"
              ></TagMultiSelect>
              {/* <TagSelect
                    control={form.control}
                    name="tagIds"
                    label="الوسوم"

                  ></TagSelect> */}
              <FieldError errors={[form.formState.errors.tagIds]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">إعدادات الSEO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <Field
                  name="seoTitle"
                  control={form.control}
                  label="عنوان SEO"
                  placeholder="أدخل عنوان SEO"
                  inputProps={{ disabled: isSubmitting }}
                />

                <Textarea
                  name="seoDescription"
                  control={form.control}
                  label="وصف SEO"
                  placeholder="أدخل وصف SEO"
                  textareaProps={{ disabled: isSubmitting }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-2xl">خيارات المنتج</CardTitle>
            <CardAction>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOptionsDialogOpen(true)}
                disabled={isSubmitting}
              >
                إضافة خيار
                <Plus data-icon="inline-end" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {productOptions.map((option, optionIndex) => (
                <Card key={`${option.optionNameAr}-${optionIndex}`} size="sm">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {option.optionNameAr}
                    </CardTitle>
                    <CardDescription>{option.optionNameEn}</CardDescription>
                    <CardAction>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          const nextOptions = productOptions.filter(
                            (_, index) => index !== optionIndex
                          )

                          form.setValue(
                            "options",
                            normalizeOptionSortOrder(nextOptions),
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            }
                          )
                        }}
                        disabled={isSubmitting}
                      >
                        <Trash2Icon
                          data-icon="inline-start"
                          className="p-0.5"
                        />
                      </Button>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value, valueIndex) => (
                        <Badge
                          key={`${value.valueAr}-${valueIndex}`}
                          variant="secondary"
                        >
                          {value.valueAr}
                          {value.colorHex ? ` (${value.colorHex})` : ""}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!productOptions.length && (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  لا يوجد خيارات مضافة بعد.
                </div>
              )}
            </div>
            <FieldError errors={[form.formState.errors.options]} />
          </CardContent>
        </Card>
      </form>

      <VariantOptionDialog
        open={optionsDialogOpen}
        onOpenChange={setOptionsDialogOpen}
        disabled={isSubmitting}
        nextSortOrder={productOptions.length}
        onChange={(option) => {
          form.setValue(
            "options",
            normalizeOptionSortOrder([...productOptions, option]),
            {
              shouldDirty: true,
              shouldValidate: true,
            }
          )
        }}
      />
    </div>
  )
}
