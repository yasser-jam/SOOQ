"use client"

import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { Controller, useFormContext } from "react-hook-form"

import type {
  AllSettingsInput,
  CurrencySymbolPosition,
  NumeralSystem,
} from "../types"
import {
  SettingsCard,
  SettingsCardContent,
  SettingsCardDescription,
  SettingsCardHeader,
  SettingsCardTitle,
} from "./SettingsCard"

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]

function toArabicDigits(value: string): string {
  return value.replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)] ?? d)
}

function formatPreview({
  position,
  decimals,
  numerals,
}: {
  position: CurrencySymbolPosition
  decimals: number
  numerals: NumeralSystem
}): string {
  const amount = 150000
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  const localizedNumber =
    numerals === "ARABIC" ? toArabicDigits(formatted) : formatted
  const symbol = numerals === "ARABIC" ? "ل.س" : "SYP"
  return position === "BEFORE"
    ? `${symbol} ${localizedNumber}`
    : `${localizedNumber} ${symbol}`
}

export default function CurrencyDisplayTab() {
  const form = useFormContext<AllSettingsInput>()

  const position = form.watch("currencySymbolPosition")
  const decimals = form.watch("currencyDecimalPlaces")
  const numerals = form.watch("numeralSystem")
  const preview = formatPreview({
    position,
    decimals: Number(decimals) || 0,
    numerals,
  })

  return (
    <SettingsCard>
      <SettingsCardHeader>
        <SettingsCardTitle>عرض العملة</SettingsCardTitle>
        <SettingsCardDescription>
          كيفية عرض الأسعار في المتجر والفواتير.
        </SettingsCardDescription>
      </SettingsCardHeader>

      <SettingsCardContent className="grid gap-6">
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="mb-1 text-xs text-muted-foreground">معاينة</p>
          <p className="text-xl font-semibold" dir="auto">
            {preview}
          </p>
        </div>

        <UiField
          data-invalid={Boolean(form.formState.errors.currencySymbolPosition)}
        >
          <FieldLabel>موقع رمز العملة</FieldLabel>
          <Controller
            name="currencySymbolPosition"
            control={form.control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex gap-6"
              >
                <label className="flex cursor-pointer items-center gap-2">
                  <RadioGroupItem value="BEFORE" />
                  <span>قبل المبلغ (ل.س ١٥٠)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <RadioGroupItem value="AFTER" />
                  <span>بعد المبلغ (١٥٠ ل.س)</span>
                </label>
              </RadioGroup>
            )}
          />
          <FieldError
            errors={[form.formState.errors.currencySymbolPosition]}
          />
        </UiField>

        <UiField data-invalid={Boolean(form.formState.errors.numeralSystem)}>
          <FieldLabel>نظام الأرقام</FieldLabel>
          <Controller
            name="numeralSystem"
            control={form.control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex gap-6"
              >
                <label className="flex cursor-pointer items-center gap-2">
                  <RadioGroupItem value="ARABIC" />
                  <span>عربية (١٢٣)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <RadioGroupItem value="LATIN" />
                  <span>لاتينية (123)</span>
                </label>
              </RadioGroup>
            )}
          />
          <FieldError errors={[form.formState.errors.numeralSystem]} />
        </UiField>

        <UiField
          className="md:max-w-xs"
          data-invalid={Boolean(form.formState.errors.currencyDecimalPlaces)}
        >
          <FieldLabel htmlFor="currencyDecimalPlaces">
            عدد المنازل العشرية
          </FieldLabel>
          <Controller
            name="currencyDecimalPlaces"
            control={form.control}
            render={({ field }) => (
              <Input
                id="currencyDecimalPlaces"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                type="number"
                min={0}
                max={4}
                value={
                  typeof field.value === "number"
                    ? field.value
                    : Number(field.value ?? 0)
                }
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
          <FieldError errors={[form.formState.errors.currencyDecimalPlaces]} />
        </UiField>
      </SettingsCardContent>
    </SettingsCard>
  )
}
