"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
} from "@workspace/ui/components/combobox"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { useMemo } from "react"
import { Controller, useFormContext } from "react-hook-form"

import { getGroupedTimezonePickerOptions } from "../timezones"
import type { AllSettingsInput } from "../types"

export default function TimezoneField() {
  const form = useFormContext<AllSettingsInput>()

  const {
    all: timezoneOptions,
    preferred: preferredOptions,
    other: otherOptions,
  } = useMemo(() => getGroupedTimezonePickerOptions(), [])

  return (
    <UiField data-invalid={Boolean(form.formState.errors.timezone)}>
      <FieldLabel htmlFor="timezone">المنطقة الزمنية</FieldLabel>
      <p className="text-xs text-muted-foreground">
        تُستخدم لعرض أوقات الطلبات والشحنات.
      </p>
      <Controller
        name="timezone"
        control={form.control}
        render={({ field }) => (
          <Combobox
            items={timezoneOptions}
            value={field.value}
            onValueChange={field.onChange}
          >
            <ComboboxInput
              id="timezone"
              placeholder="ابحث عن منطقة زمنية..."
              showClear={Boolean(field.value)}
              className="w-full md:max-w-md"
            />
            <ComboboxContent>
              <ComboboxEmpty>لا توجد مناطق زمنية مطابقة</ComboboxEmpty>
              <ComboboxList>
                <ComboboxGroup>
                  <ComboboxLabel>المناطق الشائعة</ComboboxLabel>
                  {preferredOptions.map((timezone) => (
                    <ComboboxItem key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </ComboboxItem>
                  ))}
                </ComboboxGroup>
                <ComboboxSeparator />
                <ComboboxGroup>
                  <ComboboxLabel>كل المناطق</ComboboxLabel>
                  {otherOptions.map((timezone) => (
                    <ComboboxItem key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </ComboboxItem>
                  ))}
                </ComboboxGroup>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}
      />
      <FieldError errors={[form.formState.errors.timezone]} />
    </UiField>
  )
}
