"use client"

import { useCallback, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import Field from "@/components/system/Field"
import PageDialog from "@/components/system/page-dialog"
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

export default function EditCategoryPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const params = useParams()
  const categoryId = params?.["category-id"]?.toString() ?? ""

  const searchParams = useSearchParams()
  const parentId = searchParams.get("parentId")

  const isEdit = categoryId !== "create"

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
        form.setValue('parentCategoryId', parentId.toString())
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
      router.push("/products/categories")
    },
  })

  const { isPending: isCreating, mutate: createCategory } = useMutation({
    mutationFn: createProductCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.all })
      router.push("/products/categories")
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
            <Button variant="outline">إلغاء</Button>
          </DialogClose>

          <Button type="submit" form="category-form" disabled={isSubmitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form
        id="category-form"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <Field
          name="nameAr"
          control={form.control}
          label="الاسم بالعربية"
          placeholder="أدخل الاسم بالعربية"
          inputProps={{ disabled: isSubmitting }}
        />

        <Field
          name="nameEn"
          control={form.control}
          label="الاسم بالإنجليزية"
          placeholder="أدخل الاسم بالإنجليزية"
          inputProps={{ disabled: isSubmitting }}
        />

        <Field
          name="slug"
          control={form.control}
          label="الاسم المختصر"
          placeholder="أدخل الاسم المختصر"
          inputProps={{ disabled: isSubmitting }}
        />

        <ProductMultipleCategorySelect
          name="parentCategoryId"
          control={form.control}
          label="معرف الفئة الأم"
          placeholder="اختر الفئة الأم"
          disabled={isSubmitting || isEdit}
        />

        <div className="md:col-span-2">
          <UiField data-invalid={Boolean(form.formState.errors.descriptionAr)}>
            <FieldLabel htmlFor="descriptionAr">الوصف بالعربية</FieldLabel>
            <Controller
              name="descriptionAr"
              control={form.control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="descriptionAr"
                  placeholder="أدخل الوصف بالعربية"
                  disabled={isSubmitting}
                  className="min-h-24"
                />
              )}
            />
            <FieldError errors={[form.formState.errors.descriptionAr]} />
          </UiField>
        </div>

        <div className="md:col-span-2">
          <UiField data-invalid={Boolean(form.formState.errors.descriptionEn)}>
            <FieldLabel htmlFor="descriptionEn">الوصف بالإنجليزية</FieldLabel>
            <Controller
              name="descriptionEn"
              control={form.control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="descriptionEn"
                  placeholder="أدخل الوصف بالإنجليزية"
                  disabled={isSubmitting}
                  className="min-h-24"
                />
              )}
            />
            <FieldError errors={[form.formState.errors.descriptionEn]} />
          </UiField>
        </div>

        <div className="md:col-span-2">
          <UiField
            data-invalid={Boolean(form.formState.errors.isActive)}
            className="rounded-lg border p-4"
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
                <span>الفئة نشطة</span>
                <span className="text-xs text-muted-foreground">
                  إظهار الفئة في القوائم
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
