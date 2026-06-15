"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { Check } from "lucide-react"

import Field from "@/components/system/Field"
import PageDialog from "@/components/system/page-dialog"
import { useStorePath } from "@/lib/store-path"
import {
  initCategory,
  initCategoryPayload,
} from "@/modules/product/category/init"
import {
  createProductCategory,
  getProductCategory,
  updateProductCategory,
  productCategoryKeys,
} from "@/modules/product/category/actions"
import { productCategorySchema } from "@/modules/product/category/schema"
import { ProductCategory } from "@/modules/product/category/types"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"
import { init } from "@/modules/product/category/lib/init"
import ProductMultipleCategorySelect from "@/modules/product/category/components/multiple-category-select"
import CategoryTemplateSelect from "@/modules/product/category/components/template-select"
import { attributeQueryKeys } from "@/modules/product/attribute/actions"
import TextareaField from "@/components/system/textarea"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/system/tabs"

export default function EditCategoryPage() {
  const router = useRouter()
  const storePath = useStorePath()
  const queryClient = useQueryClient()

  const params = useParams()
  const categoryId = params?.["category-id"]?.toString() ?? ""

  const searchParams = useSearchParams()
  const parentId = searchParams.get("parentId")

  const isEdit = categoryId !== "create"
  const [languageTab, setLanguageTab] = useState("ar")

  const form = useForm({
    resolver: zodResolver(productCategorySchema),
    defaultValues: init(),
  })

  const { data: category, isLoading } = useQuery({
    queryKey: productCategoryKeys.detail(categoryId),
    queryFn: () => getProductCategory(categoryId),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!isEdit) {
      form.reset(init())

      // check if we have parentId as query param, pass parentId to reset
      if (parentId) {
        form.setValue("parentCategoryId", parentId.toString())
      }

      return
    }

    if (!category) return

    form.reset(init(category))
  }, [category, form, isEdit])

  const { isPending: isUpdating, mutate: updateCategory } = useMutation({
    mutationFn: updateProductCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.all })
      router.push(storePath("/products/categories"))
    },
  })

  const { isPending: isCreating, mutate: createCategory } = useMutation({
    mutationFn: createProductCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.all })
      // Phase 5 (PRD): a templated create seeds attribute defs server-side.
      // Defensively invalidate the attribute cache so any open editor that
      // already fetched a tenant-wide list reflects the seeded entries.
      queryClient.invalidateQueries({ queryKey: attributeQueryKeys.all })
      router.push(storePath("/products/categories"))
    },
  })

  const handleSubmit = useCallback(
    (values: ProductCategory) => {
      if (isEdit) {
        if (!categoryId) return

        updateCategory(initCategory(categoryId, initCategoryPayload(values)))

        return
      }

      createCategory(initCategoryPayload(values))
    },
    [categoryId, createCategory, isEdit, updateCategory]
  )

  const isSubmitting = isUpdating || isLoading || isCreating

  return (
    <PageDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          router.back()
        }
      }}
      size="sm"
      title={isEdit ? "تعديل الفئة" : "إضافة فئة"}
      actions={
        <>
          <DialogClose asChild>
            <Button variant="ghost">إلغاء</Button>
          </DialogClose>

          <Button
            type="submit"
            form="category-form"
            disabled={isSubmitting}
            style={{ backgroundColor: "#BA7B1B" }}
          >
            حفظ
          </Button>
        </>
      }
    >
      <form
        id="category-form"
        className="flex flex-col gap-8"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        {/* المعلومات الأساسية */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold" style={{ color: "#122640" }}>
            المعلومات الأساسية
          </h3>

          <Tabs value={languageTab} onValueChange={setLanguageTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger
                value="ar"
                className="data-[state=active]:text-white"
                style={
                  languageTab === "ar"
                    ? { backgroundColor: "#BA7B1B" }
                    : undefined
                }
              >
                العربية
              </TabsTrigger>
              <TabsTrigger
                value="en"
                className="data-[state=active]:text-white"
                style={
                  languageTab === "en"
                    ? { backgroundColor: "#BA7B1B" }
                    : undefined
                }
              >
                الإنجليزية
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ar" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" style={{ color: "#122640" }}>
                    الاسم بالعربية
                  </label>
                  {form.watch("nameAr") && !form.formState.errors.nameAr && (
                    <Check className="size-4 text-green-500" />
                  )}
                </div>
                <Field
                  name="nameAr"
                  control={form.control}
                  inputProps={{
                    disabled: isSubmitting,
                    placeholder: "مثال: إلكترونيات",
                  }}
                />
                <p className="text-xs text-gray-500">
                  اسم الفئة باللغة العربية كما سيظهر للمستخدمين
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "#122640" }}>
                  الوصف بالعربية
                </label>
                <TextareaField
                  name="descriptionAr"
                  control={form.control}
                  textareaProps={{
                    disabled: isSubmitting,
                    placeholder: "مثال: أحدث الأجهزة الإلكترونية والملحقات بأسعار منافسة",
                    rows: 4,
                  }}
                />
                <p className="text-xs text-gray-500">
                  وصف تفصيلي للفئة باللغة العربية
                </p>
              </div>
            </TabsContent>

            <TabsContent value="en" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" style={{ color: "#122640" }}>
                    الاسم بالإنجليزية
                  </label>
                  {form.watch("nameEn") && !form.formState.errors.nameEn && (
                    <Check className="size-4 text-green-500" />
                  )}
                </div>
                <Field
                  name="nameEn"
                  control={form.control}
                  inputProps={{
                    disabled: isSubmitting,
                    placeholder: "Example: Electronics",
                  }}
                />
                <p className="text-xs text-gray-500">
                  اسم الفئة باللغة الإنجليزية كما سيظهر للمستخدمين
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "#122640" }}>
                  الوصف بالإنجليزية
                </label>
                <TextareaField
                  name="descriptionEn"
                  control={form.control}
                  textareaProps={{
                    disabled: isSubmitting,
                    placeholder: "Example: Latest electronic devices and accessories at competitive prices",
                    rows: 4,
                  }}
                />
                <p className="text-xs text-gray-500">
                  وصف تفصيلي للفئة باللغة الإنجليزية
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* تصنيف الفئة */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold" style={{ color: "#122640" }}>
            تصنيف الفئة
          </h3>

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "#122640" }}>
              الاسم المختصر
            </label>
            <Field
              name="slug"
              control={form.control}
              inputProps={{
                disabled: isSubmitting,
                placeholder: "مثال: electronics",
              }}
            />
            <p className="text-xs text-gray-500">
              معرف فريد للفئة يظهر في رابط URL
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "#122640" }}>
              الفئة الأم
            </label>
            <ProductMultipleCategorySelect
              name="parentCategoryId"
              control={form.control}
              placeholder="اختر الفئة الأم"
              disabled={isSubmitting || isEdit}
            />
            <p className="text-xs text-gray-500">
              الفئة الرئيسية التي تنتمي إليها هذه الفئة
            </p>
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "#122640" }}>
                قالب الفئة
              </label>
              <CategoryTemplateSelect
                name="templateKey"
                control={form.control}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                اختر قالباً لتحديد السمات الافتراضية للفئة
              </p>
            </div>
          )}
        </div>

        {/* حالة الفئة */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold" style={{ color: "#122640" }}>
            حالة الفئة
          </h3>

          <UiField
            data-invalid={Boolean(form.formState.errors.isActive)}
            className="rounded-lg border p-4"
            style={{ borderColor: "#E5E7EB" }}
          >
            <FieldLabel
              htmlFor="isActive"
              className="flex w-full items-center gap-3"
            >
              <input
                id="isActive"
                type="checkbox"
                {...form.register("isActive")}
                disabled={isSubmitting}
                className="size-4"
              />
              <div className="flex flex-col gap-1">
                <span className="font-medium">الفئة نشطة</span>
                <span className="text-xs text-muted-foreground">
                  إظهار الفئة في القوائم والبحث
                </span>
              </div>
            </FieldLabel>
            <FieldError errors={[form.formState.errors.isActive]} />
          </UiField>
        </div>
      </form>
    </PageDialog>
  )
}
