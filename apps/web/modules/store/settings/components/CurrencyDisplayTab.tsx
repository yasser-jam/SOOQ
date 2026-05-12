"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
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
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { getUpdateStoreSettingsMutationOptions } from "../actions"
import { buildCurrencyDefaults } from "../init"
import { currencySettingsSchema } from "../schema"
import type {
  CurrencySymbolPosition,
  NumeralSystem,
  StoreSettingsResponseDto,
  UpdateStoreSettingsInput,
} from "../types"

type FormInput = z.input<typeof currencySettingsSchema>
type FormOutput = z.output<typeof currencySettingsSchema>

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

export default function CurrencyDisplayTab({
  settings,
}: {
  settings: StoreSettingsResponseDto
}) {
  const queryClient = useQueryClient()
  const form = useForm<FormInput>({
    resolver: zodResolver(currencySettingsSchema),
    defaultValues: buildCurrencyDefaults(settings),
  })

  const position = form.watch("currencySymbolPosition")
  const decimals = form.watch("currencyDecimalPlaces")
  const numerals = form.watch("numeralSystem")
  const preview = formatPreview({
    position,
    decimals: Number(decimals) || 0,
    numerals,
  })

  const { isPending, mutate } = useMutation({
    ...getUpdateStoreSettingsMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تحديث عرض العملة")
      },
    }),
  })

  const handleSubmit = (raw: FormInput) => {
    const data = currencySettingsSchema.parse(raw) as FormOutput
    const payload: UpdateStoreSettingsInput = {}
    const initial = buildCurrencyDefaults(settings)
    if (data.currencySymbolPosition !== initial.currencySymbolPosition)
      payload.currencySymbolPosition = data.currencySymbolPosition
    if (data.currencyDecimalPlaces !== initial.currencyDecimalPlaces)
      payload.currencyDecimalPlaces = data.currencyDecimalPlaces
    if (data.numeralSystem !== initial.numeralSystem)
      payload.numeralSystem = data.numeralSystem

    if (Object.keys(payload).length === 0) {
      toast.info("لا تغييرات للحفظ")
      return
    }
    mutate(payload)
  }

  return (
    <Card>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardHeader>
          <CardTitle>عرض العملة</CardTitle>
          <CardDescription>
            كيفية عرض الأسعار في المتجر والفواتير.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground mb-1">معاينة</p>
            <p className="text-2xl font-semibold" dir="auto">
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
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="BEFORE" />
                    <span>قبل المبلغ (ل.س ١٥٠)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
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
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="ARABIC" />
                    <span>عربية (١٢٣)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
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
        </CardContent>

        <CardFooter className="justify-end">
          <Button type="submit" loading={isPending}>
            حفظ
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
