"use client"

import { Controller, useFormContext } from "react-hook-form"

import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"

import Field from "@/components/system/Field"
import SysSwitch from "@/components/system/switch"
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

      <UiField data-invalid={Boolean(form.formState.errors.currencyCode)}>
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

      <Controller
        name="allowOversell"
        control={form.control}
        render={({ field, fieldState }) => (
          <UiField data-invalid={fieldState.invalid}>
            <SysSwitch
              label="السماح بالبيع عند نفاد المخزون"
              description="يمكن للعملاء طلب المنتج حتى لو نفد المخزون"
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
            />
            <FieldError errors={[fieldState.error]} />
          </UiField>
        )}
      />
    </div>
  )
}
