"use client"

import { useCallback, useEffect, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import Field from "@/components/system/Field"
import PageDialog from "@/components/system/page-dialog"
import { slugify } from "@/components/system/creatable-select"
import { useStorePath } from "@/lib/store-path"
import {
  initCategory,
  initCategoryPayload,
} from "@/modules/product/category/init"
import {
  getProductCategoryQueryOptions,
  getCreateProductCategoryMutationOptions,
  getUpdateProductCategoryMutationOptions,
} from "@/modules/product/category/actions"
import { productCategorySchema } from "@/modules/product/category/schema"
import { ProductCategory } from "@/modules/product/category/types"
import { init } from "@/modules/product/category/lib/init"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"
import CategorySelect from "@/modules/product/category/components/select"
import CategoryTemplateSelect from "@/modules/product/category/components/template-select"
import TextareaField from "@/components/system/textarea"
import SysSwitch from "@/components/system/switch"

export default function EditCategoryPage() {
  const router = useRouter()
  const storePath = useStorePath()
  const queryClient = useQueryClient()

  const params = useParams()
  const categoryId = params?.["category-id"]?.toString() ?? ""

  const searchParams = useSearchParams()
  const parentIdFromQuery = searchParams.get("parentId")

  const isEdit = categoryId !== "create"
  const userEditedSlug = useRef(false)

  const form = useForm({
    resolver: zodResolver(productCategorySchema),
    defaultValues: init(),
  })

  const nameEn = form.watch("nameEn")
  const nameAr = form.watch("nameAr")

  const { data: category, isLoading } = useQuery({
    ...getProductCategoryQueryOptions(categoryId),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!isEdit) {
      userEditedSlug.current = false
      form.reset(init())

      if (parentIdFromQuery) {
        form.setValue("parentCategoryId", parentIdFromQuery)
      }

      return
    }

    if (!category) return

    userEditedSlug.current = true
    form.reset(init(category))
  }, [category, form, isEdit, parentIdFromQuery])

  // auto create slug from name
  useEffect(() => {
    if (isEdit || userEditedSlug.current) return

    const source = (nameEn?.trim() || nameAr?.trim()) ?? ""
    const generated = source ? slugify(source) : ""

    if (generated !== form.getValues("slug")) {
      form.setValue("slug", generated, { shouldValidate: true })
    }
  }, [form, isEdit, nameAr, nameEn])

  const { isPending: isUpdating, mutate: updateCategory } = useMutation({
    ...getUpdateProductCategoryMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تحديث الفئة بنجاح")
        router.push(storePath("/products/categories"))
      },
    }),
  })

  const { isPending: isCreating, mutate: createCategory } = useMutation({
    ...getCreateProductCategoryMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم إنشاء الفئة بنجاح")
        router.push(storePath("/products/categories"))
      },
    }),
  })

  const handleSubmit = useCallback(
    (values: ProductCategory) => {
      const payload = initCategoryPayload({
        ...values,
        slug:
          values.slug ||
          slugify(values.nameEn?.trim() || values.nameAr?.trim() || ""),
      })

      if (isEdit) {
        if (!categoryId) return

        updateCategory(initCategory(categoryId, payload))

        return
      }

      createCategory(payload)
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
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        {/* المعلومات الأساسية */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold" style={{ color: "#122640" }}>
            المعلومات الأساسية
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Field
                name="nameAr"
                control={form.control}
                label="الاسم بالعربية"
                inputProps={{
                  disabled: isSubmitting,
                  placeholder: "مثال: إلكترونيات",
                }}
              />
              <p className="text-xs text-gray-500">
                اسم الفئة باللغة العربية كما سيظهر للمستخدمين
              </p>
            </div>
            <div className="space-y-1">
              <Field
                name="nameEn"
                control={form.control}
                label="الاسم بالإنجليزية"
                inputProps={{
                  disabled: isSubmitting,
                  placeholder: "Example: Electronics",
                }}
              />
              <p className="text-xs text-gray-500">
                اسم الفئة باللغة الإنجليزية كما سيظهر للمستخدمين
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <TextareaField
              name="descriptionAr"
              control={form.control}
              label="الوصف بالعربية"
              textareaProps={{
                placeholder:
                  "مثال: أحدث الأجهزة الإلكترونية والملحقات بأسعار منافسة",
                disabled: isSubmitting,
                rows: 4,
              }}
            />
            <p className="text-xs text-gray-500">
              وصف تفصيلي للفئة باللغة العربية
            </p>
          </div>

          <div className="space-y-1">
            <TextareaField
              name="descriptionEn"
              control={form.control}
              label="الوصف بالإنجليزية"
              textareaProps={{
                disabled: isSubmitting,
                placeholder:
                  "Example: Latest electronic devices and accessories at competitive prices",
                rows: 4,
              }}
            />
            <p className="text-xs text-gray-500">
              وصف تفصيلي للفئة باللغة الإنجليزية
            </p>
          </div>
        </div>

        <CategorySelect
          name="parentCategoryId"
          control={form.control}
          label="الفئة الأم"
          placeholder="اختر الفئة الأم"
          allowNone
          disabled={isSubmitting || isEdit}
          description="الفئة الرئيسية التي تنتمي إليها هذه الفئة"
        />

        {!isEdit && (
          <CategoryTemplateSelect
            name="templateKey"
            control={form.control}
            disabled={isSubmitting}
          />
        )}

        <SysSwitch
          label="الفئة نشطة"
          description="إظهار الفئة في القوائم والبحث"
          value={form.watch("isActive")}
          onChange={(value) => form.setValue("isActive", value)}
        />
      </form>
    </PageDialog>
  )
}
