"use client"

import { Controller, useFormContext } from "react-hook-form"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"

import Field from "@/components/system/Field"
import Textarea from "@/components/system/textarea"
import CurrencySelect from "@/modules/product/product/components/currency-select"
import StatusSelect from "@/modules/product/product/components/status-select"

type Props = {
  isSubmitting: boolean
}

export default function BasicsTab({ isSubmitting }: Props) {
  const form = useFormContext()

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
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

      <Card>
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
              label="سعر المقارنة (يظهر شطباً على الواجهة)"
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
  )
}
