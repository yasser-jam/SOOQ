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
import { Button } from "@workspace/ui/components/button"
import dynamic from "next/dynamic"
import { Controller, useFormContext } from "react-hook-form"

import type { AllSettingsInput, StoreSettingsResponseDto } from "../types"

// Leaflet binds to `window`, so the picker is loaded client-only.
const MapPinPicker = dynamic(
  () => import("@/components/system/map-pin-picker"),
  { ssr: false }
)

const COORDINATE_DISPLAY_PRECISION = 6

export default function AddressTab({
  settings: _settings,
}: {
  settings: StoreSettingsResponseDto
}) {
  const form = useFormContext<AllSettingsInput>()

  const latitude = form.watch("latitude")
  const longitude = form.watch("longitude")

  const clearPin = () => {
    form.setValue("latitude", null, { shouldDirty: true, shouldValidate: true })
    form.setValue("longitude", null, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <Card className="rounded-2xl border-gray-200/50 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[#1e3a47]">عنوان المتجر</CardTitle>
        <CardDescription className="text-sm text-gray-600 font-medium">
          عنوان النشاط التجاري الذي يظهر في صفحة الاتصال والفواتير. يمكنك
          أيضاً تحديد موقع المتجر على الخريطة لإظهاره للزبائن.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
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
      </CardContent>
    </Card>
  )
}
