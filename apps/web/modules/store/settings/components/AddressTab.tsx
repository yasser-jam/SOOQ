"use client"

import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import dynamic from "next/dynamic"
import { Controller, useFormContext } from "react-hook-form"

import type { AllSettingsInput } from "../types"
import {
  SettingsCard,
  SettingsCardContent,
  SettingsCardDescription,
  SettingsCardHeader,
  SettingsCardTitle,
} from "./SettingsCard"
import TimezoneField from "./TimezoneField"

const MapPinPicker = dynamic(
  () => import("@/components/system/map-pin-picker"),
  { ssr: false }
)

const COORDINATE_DISPLAY_PRECISION = 6

export default function AddressTab() {
  const form = useFormContext<AllSettingsInput>()

  const latitude = form.watch("latitude")
  const longitude = form.watch("longitude")

  const clearPin = () => {
    form.setValue("latitude", null, { shouldDirty: true, shouldValidate: true })
    form.setValue("longitude", null, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <SettingsCard>
      <SettingsCardHeader>
        <SettingsCardTitle>عنوان المتجر</SettingsCardTitle>
        <SettingsCardDescription>
          عنوان النشاط التجاري الذي يظهر في صفحة الاتصال والفواتير. يمكنك
          أيضاً تحديد موقع المتجر على الخريطة لإظهاره للزبائن.
        </SettingsCardDescription>
      </SettingsCardHeader>

      <SettingsCardContent className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <UiField data-invalid={Boolean(form.formState.errors.governorate)}>
            <FieldLabel htmlFor="governorate">المحافظة</FieldLabel>
            <Controller
              name="governorate"
              control={form.control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="governorate"
                  placeholder="دمشق"
                />
              )}
            />
            <FieldError errors={[form.formState.errors.governorate]} />
          </UiField>

          <UiField data-invalid={Boolean(form.formState.errors.city)}>
            <FieldLabel htmlFor="city">المدينة</FieldLabel>
            <Controller
              name="city"
              control={form.control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="city"
                  placeholder="دمشق"
                />
              )}
            />
            <FieldError errors={[form.formState.errors.city]} />
          </UiField>

          <UiField data-invalid={Boolean(form.formState.errors.street)}>
            <FieldLabel htmlFor="street">الشارع</FieldLabel>
            <Controller
              name="street"
              control={form.control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="street"
                  placeholder="الحمراء"
                />
              )}
            />
            <FieldError errors={[form.formState.errors.street]} />
          </UiField>
        </div>

        <TimezoneField />

        <UiField data-invalid={Boolean(form.formState.errors.latitude)}>
          <FieldLabel>الموقع على الخريطة</FieldLabel>
          <p className="text-xs text-muted-foreground">
            انقر على الخريطة أو اسحب الدبوس لتعيين موقع المتجر. ستظهر
            إحداثيات (خط العرض / خط الطول) أسفل الخريطة.
          </p>
          <MapPinPicker
            latitude={latitude ?? null}
            longitude={longitude ?? null}
            onChange={({ latitude: lat, longitude: lng }) => {
              form.setValue("latitude", lat, {
                shouldDirty: true,
                shouldValidate: true,
              })
              form.setValue("longitude", lng, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }}
          />
          <div
            className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"
            dir="ltr"
          >
            <span className="font-mono">
              {latitude != null && longitude != null ? (
                <>
                  lat: {latitude.toFixed(COORDINATE_DISPLAY_PRECISION)} · lng:{" "}
                  {longitude.toFixed(COORDINATE_DISPLAY_PRECISION)}
                </>
              ) : (
                <span dir="rtl">لم يتم تحديد موقع بعد</span>
              )}
            </span>
            {(latitude != null || longitude != null) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearPin}
              >
                <span dir="rtl">إزالة الدبوس</span>
              </Button>
            )}
          </div>
          <FieldError errors={[form.formState.errors.latitude]} />
        </UiField>
      </SettingsCardContent>
    </SettingsCard>
  )
}
