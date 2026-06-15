"use client"

import { useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { z } from "zod"

import Field from "@/components/system/Field"
import PageDialog from "@/components/system/page-dialog"
import { useStorePath } from "@/lib/store-path"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"

import {
  attributeQueryKeys,
  createAttributeDefinition,
  getAttributeDefinition,
  updateAttributeDefinition,
} from "@/modules/product/attribute/actions"
import { initAttribute } from "@/modules/product/attribute/init"
import { attributeDefinitionSchema } from "@/modules/product/attribute/schema"
import { ATTRIBUTE_DATA_TYPES } from "@/modules/product/attribute/types"
import CategorySelect from "@/modules/product/category/components/select"

const dataTypeLabels: Record<string, string> = {
  TEXT: "نص (TEXT)",
  NUMBER: "رقم (NUMBER)",
  BOOLEAN: "صح/خطأ (BOOLEAN)",
  SELECT: "اختيار واحد (SELECT)",
  MULTI_SELECT: "اختيار متعدّد (MULTI_SELECT)",
}

type FormInput = z.input<typeof attributeDefinitionSchema>
type FormOutput = z.output<typeof attributeDefinitionSchema>

export default function EditAttributeDefinitionPage() {
  const router = useRouter()
  const storePath = useStorePath()
  const queryClient = useQueryClient()
  const params = useParams()
  const attributeId = params?.["attribute-id"]?.toString() ?? ""
  const isEdit = attributeId !== "create"

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(attributeDefinitionSchema),
    defaultValues: initAttribute() as FormInput,
  })

  const optionsArray = useFieldArray({
    control: form.control,
    name: "options",
  })

  const { data: definition, isLoading } = useQuery({
    queryKey: attributeQueryKeys.detail(attributeId),
    queryFn: () => getAttributeDefinition(attributeId),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!isEdit) {
      form.reset(initAttribute() as FormInput)
      return
    }
    if (!definition) return
    form.reset(initAttribute(definition) as FormInput)
  }, [form, isEdit, definition])

  const dataType = useWatch({ control: form.control, name: "dataType" })
  const isSelectType = dataType === "SELECT" || dataType === "MULTI_SELECT"

  const { isPending: isUpdating, mutate: doUpdate } = useMutation({
    mutationFn: updateAttributeDefinition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeQueryKeys.all })
      router.push(storePath("/products/attributes"))
    },
  })

  const { isPending: isCreating, mutate: doCreate } = useMutation({
    mutationFn: createAttributeDefinition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeQueryKeys.all })
      router.push(storePath("/products/attributes"))
    },
  })

  const handleSubmit = useCallback(
    (values: FormOutput) => {
      // Strip options from non-SELECT types — backend ignores but cleaner payload
      const payload = {
        ...values,
        options: isSelectType ? values.options : [],
      }
      if (isEdit) {
        if (!attributeId) return
        doUpdate({ id: attributeId, data: payload })
        return
      }
      doCreate(payload)
    },
    [doCreate, doUpdate, isEdit, attributeId, isSelectType]
  )

  const isSubmitting = isUpdating || isLoading || isCreating

  return (
    <PageDialog
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
      size="lg"
      title={isEdit ? "تعديل السمة" : "إضافة سمة"}
      actions={
        <>
          <DialogClose asChild>
            <Button variant="ghost">إلغاء</Button>
          </DialogClose>
          <Button
            type="submit"
            form="attribute-form"
            disabled={isSubmitting}
            style={{ backgroundColor: "#BA7B1B" }}
            className="text-white px-6 py-2"
          >
            حفظ
          </Button>
        </>
      }
    >
      <form
        id="attribute-form"
        className="flex flex-col gap-8"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        {/* المعلومات الأساسية */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold" style={{ color: "#122640" }}>
            المعلومات الأساسية
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1" style={{ color: "#122640" }}>
                الاسم بالعربية
                <span className="text-red-500">*</span>
              </label>
              <Field
                name="attributeNameAr"
                control={form.control}
                inputProps={{
                  disabled: isSubmitting,
                  placeholder: "مثال: اللون",
                  className: "rounded-lg",
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1" style={{ color: "#122640" }}>
                الاسم بالإنجليزية
                <span className="text-red-500">*</span>
              </label>
              <Field
                name="attributeNameEn"
                control={form.control}
                inputProps={{
                  disabled: isSubmitting,
                  placeholder: "e.g. Color",
                  className: "rounded-lg",
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1" style={{ color: "#122640" }}>
                المفتاح (Key)
                <span className="text-red-500">*</span>
              </label>
              <Field
                name="attributeKey"
                control={form.control}
                inputProps={{
                  disabled: isSubmitting,
                  placeholder: "color",
                  dir: "ltr",
                  className: "rounded-lg",
                }}
              />
              <p className="text-xs text-gray-500">
                هذا الحقل يستخدم برمجياً، يفضل استخدامه بالإنجليزية وبدون مسافات
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1" style={{ color: "#122640" }}>
                النوع
                <span className="text-red-500">*</span>
              </label>
              <UiField data-invalid={Boolean(form.formState.errors.dataType)}>
                <Controller
                  name="dataType"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTRIBUTE_DATA_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {dataTypeLabels[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[form.formState.errors.dataType]} />
              </UiField>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" style={{ color: "#122640" }}>
                نطاق الفئة (اختياري)
              </label>
              <CategorySelect
                name="categoryId"
                control={form.control}
                placeholder="فارغ = على المتجر كاملاً"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "#122640" }}>
                ترتيب العرض
              </label>
              <Field
                name="sortOrder"
                control={form.control}
                inputProps={{
                  disabled: isSubmitting,
                  type: "number",
                  min: 0,
                  className: "rounded-lg",
                }}
              />
            </div>
          </div>
        </div>

        {/* الإعدادات الإضافية */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold" style={{ color: "#122640" }}>
            الإعدادات الإضافية
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">إلزامي عند إنشاء المنتج</span>
                <span className="text-xs text-muted-foreground">
                  يطلب من التاجر إدخال هذه السمة
                </span>
              </div>
              <Controller
                name="isRequired"
                control={form.control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">قابل للفلترة في الواجهة</span>
                <span className="text-xs text-muted-foreground">
                  يظهر في فلترات البحث
                </span>
              </div>
              <Controller
                name="isFilterable"
                control={form.control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">مرئي على الواجهة</span>
                <span className="text-xs text-muted-foreground">
                  يظهر في صفحة المنتج
                </span>
              </div>
              <Controller
                name="isVisibleOnStorefront"
                control={form.control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* الخيارات المتاحة */}
        {isSelectType ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-lg font-bold" style={{ color: "#122640" }}>
                  الخيارات المتاحة
                </h3>
                <span className="text-xs text-muted-foreground">
                  مطلوب على الأقل خيار واحد لـ SELECT/MULTI_SELECT
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  optionsArray.append({
                    optionValueAr: "",
                    optionValueEn: "",
                    sortOrder: optionsArray.fields.length,
                  })
                }
                disabled={isSubmitting}
                style={{ backgroundColor: "#BA7B1B" }}
                className="text-white"
              >
                <Plus className="size-4 ml-2" />
                إضافة خيار
              </Button>
            </div>

            {optionsArray.fields.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center" style={{ borderColor: "#E5E7EB" }}>
                <p className="text-sm text-muted-foreground">
                  لا توجد خيارات بعد. اضغط «إضافة خيار» لبدء التعريف.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {optionsArray.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] items-end rounded-lg border p-4"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium" style={{ color: "#122640" }}>
                        القيمة بالعربية #{index + 1}
                      </label>
                      <Field
                        name={`options.${index}.optionValueAr`}
                        control={form.control}
                        inputProps={{
                          disabled: isSubmitting,
                          placeholder: "مثال: أحمر",
                          className: "rounded-lg",
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" style={{ color: "#122640" }}>
                        بالإنجليزية
                      </label>
                      <Field
                        name={`options.${index}.optionValueEn`}
                        control={form.control}
                        inputProps={{
                          disabled: isSubmitting,
                          placeholder: "Red",
                          dir: "ltr",
                          className: "rounded-lg",
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => optionsArray.remove(index)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <FieldError errors={[form.formState.errors.options as never]} />
          </div>
        ) : null}
      </form>
    </PageDialog>
  )
}
