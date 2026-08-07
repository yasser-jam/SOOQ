"use client"

import { useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { z } from "zod"
import { toast } from "sonner"

import Field from "@/components/system/Field"
import PageDialog from "@/components/system/page-dialog"
import SysSwitch from "@/components/system/switch"
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

import {
  getAttributeDefinitionQueryOptions,
  getCreateAttributeDefinitionMutationOptions,
  getUpdateAttributeDefinitionMutationOptions,
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
    ...getAttributeDefinitionQueryOptions(attributeId),
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
    ...getUpdateAttributeDefinitionMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تحديث السمة بنجاح")
        router.push(storePath("/products/attributes"))
      },
    }),
  })

  const { isPending: isCreating, mutate: doCreate } = useMutation({
    ...getCreateAttributeDefinitionMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم إنشاء السمة بنجاح")
        router.push(storePath("/products/attributes"))
      },
    }),
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
            className="px-6 py-2 text-white"
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field
            name="attributeNameAr"
            control={form.control}
            label="الاسم بالعربية"
            inputProps={{
              disabled: isSubmitting,
              placeholder: "مثال: اللون",
              className: "rounded-lg",
            }}
          />

          <Field
            name="attributeNameEn"
            control={form.control}
            label="الاسم بالإنجليزية"
            inputProps={{
              disabled: isSubmitting,
              placeholder: "e.g. Color",
              className: "rounded-lg",
            }}
          />

          <div>
            <Field
              name="attributeKey"
              control={form.control}
              label="المفتاح (Key)"
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

          <UiField data-invalid={Boolean(form.formState.errors.dataType)}>
            <FieldLabel>النوع</FieldLabel>
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

          <CategorySelect
            name="categoryId"
            control={form.control}
            placeholder="فارغ = على المتجر كاملاً"
            disabled={isSubmitting}
            label="نطاق الفئة (اختياري)"
          />

          <Field
            name="sortOrder"
            control={form.control}
            label="ترتيب العرض"
            inputProps={{
              disabled: isSubmitting,
              type: "number",
              min: 0,
              className: "rounded-lg",
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Controller
            name="isRequired"
            control={form.control}
            render={({ field }) => (
              <SysSwitch
                variant="primary"
                label="إلزامي عند إنشاء المنتج"
                description="يطلب من التاجر إدخال هذه السمة"
                value={field.value ?? false}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="isFilterable"
            control={form.control}
            render={({ field }) => (
              <SysSwitch
                variant="secondary"
                label="قابل للفلترة في الواجهة"
                description="يظهر في فلترات البحث"
                value={field.value ?? false}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="isVisibleOnStorefront"
            control={form.control}
            render={({ field }) => (
              <SysSwitch
                variant="neutral"
                label="مرئي على الواجهة"
                description="يظهر في صفحة المنتج"
                value={field.value ?? false}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </div>

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
                <Plus className="ml-2 size-4" />
                إضافة خيار
              </Button>
            </div>

            {optionsArray.fields.length === 0 ? (
              <div
                className="rounded-lg border border-dashed p-8 text-center"
                style={{ borderColor: "#E5E7EB" }}
              >
                <p className="text-sm text-muted-foreground">
                  لا توجد خيارات بعد. اضغط «إضافة خيار» لبدء التعريف.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {optionsArray.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 items-end gap-4 rounded-lg border p-4 md:grid-cols-[1fr_1fr_auto]"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        style={{ color: "#122640" }}
                      >
                        القيمة بالعربية #{index + 1}
                      </label>
                      <Field
                        name={`options.${index}.optionValueAr`}
                        control={form.control}
                        label="القيمة بالعربية #{index + 1}"
                        inputProps={{
                          disabled: isSubmitting,
                          placeholder: "مثال: أحمر",
                          className: "rounded-lg",
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        style={{ color: "#122640" }}
                      >
                        بالإنجليزية
                      </label>

                      <Field
                        name={`options.${index}.optionValueEn`}
                        control={form.control}
                        label="القيمة بالإنجليزية #{index + 1}"
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
          </div>
        ) : null}
      </form>
    </PageDialog>
  )
}
