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
import CurrencySelect from "@/modules/product/product/components/currency-select"

type Props = {
  isSubmitting: boolean
}

export default function PricingSection({ isSubmitting }: Props) {
  const form = useFormContext()

  return (
    <div className="space-y-4">
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
        className="rounded-lg border p-4 bg-gray-50"
      >
        <FieldLabel
          htmlFor="allowOversell"
          className="flex w-full items-center gap-3 cursor-pointer"
        >
          <input
            id="allowOversell"
            type="checkbox"
            {...form.register("allowOversell")}
            disabled={isSubmitting}
            className="size-4"
          />
          <div className="flex flex-col gap-1">
            <span className="font-medium">السماح بالبيع عند نفاد المخزون</span>
            <span className="text-sm text-gray-500">
              عند تفعيل هذا الخيار، يمكن للعملاء طلب المنتج حتى لو نفد المخزون
            </span>
          </div>
        </FieldLabel>
        <FieldError errors={[form.formState.errors.allowOversell]} />
      </UiField>
    </div>
  )
}
