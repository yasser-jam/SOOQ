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
          >
            حفظ
          </Button>
        </>
      }
    >
      <form
        id="attribute-form"
        className="grid gap-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            name="attributeNameAr"
            control={form.control}
            label="الاسم بالعربية"
            placeholder="مثال: اللون"
            inputProps={{ disabled: isSubmitting }}
          />

          <Field
            name="attributeNameEn"
            control={form.control}
            label="الاسم بالإنجليزية"
            placeholder="e.g. Color"
            inputProps={{ disabled: isSubmitting }}
          />

          <Field
            name="attributeKey"
            control={form.control}
            label="المفتاح (key)"
            placeholder="color"
            inputProps={{ disabled: isSubmitting, dir: "ltr" }}
          />

          <UiField data-invalid={Boolean(form.formState.errors.dataType)}>
            <FieldLabel htmlFor="dataType">النوع</FieldLabel>
            <Controller
              name="dataType"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="dataType">
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
            label="نطاق الفئة (اختياري)"
            placeholder="فارغ = على المتجر كاملاً"
            disabled={isSubmitting}
          />

          <Field
            name="sortOrder"
            control={form.control}
            label="ترتيب العرض"
            inputProps={{ disabled: isSubmitting, type: "number", min: 0 }}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 rounded-lg border p-3">
          <UiField className="flex items-center gap-2">
            <input
              id="isRequired"
              type="checkbox"
              {...form.register("isRequired")}
              disabled={isSubmitting}
              className="size-4"
            />
            <FieldLabel htmlFor="isRequired" className="m-0">
              إلزامي عند إنشاء المنتج
            </FieldLabel>
          </UiField>

          <UiField className="flex items-center gap-2">
            <input
              id="isFilterable"
              type="checkbox"
              {...form.register("isFilterable")}
              disabled={isSubmitting}
              className="size-4"
            />
            <FieldLabel htmlFor="isFilterable" className="m-0">
              قابل للفلترة في الواجهة
            </FieldLabel>
          </UiField>

          <UiField className="flex items-center gap-2">
            <input
              id="isVisibleOnStorefront"
              type="checkbox"
              {...form.register("isVisibleOnStorefront")}
              disabled={isSubmitting}
              className="size-4"
            />
            <FieldLabel htmlFor="isVisibleOnStorefront" className="m-0">
              مرئي على الواجهة
            </FieldLabel>
          </UiField>
        </div>

        {isSelectType ? (
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">الخيارات المتاحة</span>
                <span className="text-xs text-muted-foreground">
                  مطلوب على الأقل خيار واحد لـ SELECT/MULTI_SELECT
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  optionsArray.append({
                    optionValueAr: "",
                    optionValueEn: "",
                    sortOrder: optionsArray.fields.length,
                  })
                }
                disabled={isSubmitting}
              >
                <Plus className="size-4" />
                إضافة خيار
              </Button>
            </div>

            {optionsArray.fields.length === 0 ? (
              <p className="rounded border border-dashed p-3 text-center text-sm text-muted-foreground">
                لا توجد خيارات بعد. اضغط «إضافة خيار» لبدء التعريف.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {optionsArray.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] items-end gap-2 rounded border p-2"
                  >
                    <Field
                      name={`options.${index}.optionValueAr`}
                      control={form.control}
                      label={`القيمة بالعربية #${index + 1}`}
                      placeholder="مثال: أحمر"
                      inputProps={{ disabled: isSubmitting }}
                    />
                    <Field
                      name={`options.${index}.optionValueEn`}
                      control={form.control}
                      label="بالإنجليزية"
                      placeholder="Red"
                      inputProps={{ disabled: isSubmitting, dir: "ltr" }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
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
