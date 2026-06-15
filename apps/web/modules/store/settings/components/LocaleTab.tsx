"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
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
import { Controller, useFormContext } from "react-hook-form"

import { TIMEZONE_OPTIONS } from "../init"
import type { AllSettingsInput, StoreSettingsResponseDto } from "../types"

export default function LocaleTab({
  settings: _settings,
}: {
  settings: StoreSettingsResponseDto
}) {
  const form = useFormContext<AllSettingsInput>()

  return (
    <Card className="rounded-2xl border-gray-200/50 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[#1e3a47]">المنطقة الزمنية</CardTitle>
        <CardDescription className="text-sm text-gray-600 font-medium">
          تُستخدم لعرض أوقات الطلبات والشحنات.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        <UiField data-invalid={Boolean(form.formState.errors.timezone)}>
          <FieldLabel htmlFor="timezone">المنطقة الزمنية</FieldLabel>
          <Controller
            name="timezone"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="timezone" className="w-full md:max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[form.formState.errors.timezone]} />
        </UiField>
      </CardContent>
    </Card>
  )
}
