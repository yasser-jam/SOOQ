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
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { getUpdateStoreSettingsMutationOptions } from "../actions"
import { DAY_LABELS_AR, ensureBusinessHours } from "../init"
import { businessHoursSettingsSchema } from "../schema"
import type {
  BusinessHourDto,
  StoreSettingsResponseDto,
  UpdateStoreSettingsInput,
} from "../types"

type FormInput = z.infer<typeof businessHoursSettingsSchema>

export default function BusinessHoursTab({
  settings,
}: {
  settings: StoreSettingsResponseDto
}) {
  const queryClient = useQueryClient()
  const form = useForm<FormInput>({
    resolver: zodResolver(businessHoursSettingsSchema),
    defaultValues: {
      businessHours: ensureBusinessHours(settings.businessHours),
    },
  })

  const hours = form.watch("businessHours")

  const { isPending, mutate } = useMutation({
    ...getUpdateStoreSettingsMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تحديث ساعات العمل")
      },
    }),
  })

  const handleSubmit = (data: FormInput) => {
    const normalized: BusinessHourDto[] = data.businessHours.map((h) =>
      h.open
        ? { day: h.day, open: true, opensAt: h.opensAt ?? null, closesAt: h.closesAt ?? null }
        : { day: h.day, open: false, opensAt: null, closesAt: null }
    )
    const payload: UpdateStoreSettingsInput = { businessHours: normalized }
    mutate(payload)
  }

  return (
    <Card>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardHeader>
          <CardTitle>ساعات العمل</CardTitle>
          <CardDescription>
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

        <CardFooter className="justify-end">
          <Button type="submit" loading={isPending}>
            حفظ
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
