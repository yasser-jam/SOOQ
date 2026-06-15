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
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import { Controller, useFormContext } from "react-hook-form"

import { DAY_LABELS_AR } from "../init"
import type { AllSettingsInput, StoreSettingsResponseDto } from "../types"

export default function BusinessHoursTab({
  settings: _settings,
}: {
  settings: StoreSettingsResponseDto
}) {
  const form = useFormContext<AllSettingsInput>()
  const hours = form.watch("businessHours")

  return (
    <Card className="rounded-2xl border-gray-200/50 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[#1e3a47]">ساعات العمل</CardTitle>
        <CardDescription className="text-sm text-gray-600 font-medium">
          حدّد أيام عمل المتجر وساعاته. تظهر للعملاء على واجهة المتجر.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {hours.map((hour, index) => {
          const isOpen = hour.open
          return (
            <div
              key={hour.day}
              className="grid items-center gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-[120px_100px_1fr_1fr]"
            >
              <span className="font-medium">{DAY_LABELS_AR[hour.day]}</span>

              <Controller
                name={`businessHours.${index}.open`}
                control={form.control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <span>{field.value ? "مفتوح" : "مغلق"}</span>
                  </label>
                )}
              />

              <UiField
                data-invalid={Boolean(
                  form.formState.errors.businessHours?.[index]?.opensAt
                )}
              >
                <Controller
                  name={`businessHours.${index}.opensAt`}
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      type="time"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      disabled={!isOpen}
                      placeholder="09:00"
                    />
                  )}
                />
                <FieldError
                  errors={[
                    form.formState.errors.businessHours?.[index]?.opensAt,
                  ]}
                />
              </UiField>

              <UiField
                data-invalid={Boolean(
                  form.formState.errors.businessHours?.[index]?.closesAt
                )}
              >
                <Controller
                  name={`businessHours.${index}.closesAt`}
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      type="time"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      disabled={!isOpen}
                      placeholder="17:00"
                    />
                  )}
                />
                <FieldError
                  errors={[
                    form.formState.errors.businessHours?.[index]?.closesAt,
                  ]}
                />
              </UiField>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
