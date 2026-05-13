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
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Controller, useFormContext } from "react-hook-form"

import PhoneField from "@/components/system/PhoneField"

import type { AllSettingsInput, StoreSettingsResponseDto } from "../types"

export default function GeneralTab({
  settings: _settings,
}: {
  settings: StoreSettingsResponseDto
}) {
  const form = useFormContext<AllSettingsInput>()

  return (
    <Card>
      <CardHeader>
        <CardTitle>الملف العام</CardTitle>
        <CardDescription>
          اسم المتجر والوصف وبيانات التواصل.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-2">
        <UiField data-invalid={Boolean(form.formState.errors.profileNameAr)}>
          <FieldLabel htmlFor="profileNameAr">اسم المتجر (عربي)</FieldLabel>
          <Controller
            name="profileNameAr"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                id="profileNameAr"
                placeholder="متجر سوق"
              />
            )}
          />
          <FieldError errors={[form.formState.errors.profileNameAr]} />
        </UiField>

        <UiField data-invalid={Boolean(form.formState.errors.profileNameEn)}>
          <FieldLabel htmlFor="profileNameEn">اسم المتجر (إنجليزي)</FieldLabel>
          <Controller
            name="profileNameEn"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                id="profileNameEn"
                placeholder="Souq Store"
              />
            )}
          />
          <FieldError errors={[form.formState.errors.profileNameEn]} />
        </UiField>

        <UiField
          className="md:col-span-2"
          data-invalid={Boolean(form.formState.errors.profileDescription)}
        >
          <FieldLabel htmlFor="profileDescription">وصف المتجر</FieldLabel>
          <Controller
            name="profileDescription"
            control={form.control}
            render={({ field }) => (
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="profileDescription"
                placeholder="نبذة قصيرة عن المتجر..."
                className="min-h-24"
              />
            )}
          />
          <FieldError errors={[form.formState.errors.profileDescription]} />
        </UiField>

        <UiField data-invalid={Boolean(form.formState.errors.contactEmail)}>
          <FieldLabel htmlFor="contactEmail">البريد الإلكتروني</FieldLabel>
          <Controller
            name="contactEmail"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                id="contactEmail"
                type="email"
                placeholder="owner@souq.com"
              />
            )}
          />
          <FieldError errors={[form.formState.errors.contactEmail]} />
        </UiField>

        <PhoneField
          name="contactPhone"
          control={form.control}
          label="رقم الهاتف"
        />
      </CardContent>
    </Card>
  )
}
