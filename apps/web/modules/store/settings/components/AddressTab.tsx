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
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { getUpdateStoreSettingsMutationOptions } from "../actions"
import { buildAddressDefaults } from "../init"
import { addressSettingsSchema } from "../schema"
import type { StoreSettingsResponseDto, UpdateStoreSettingsInput } from "../types"

type FormInput = z.infer<typeof addressSettingsSchema>

export default function AddressTab({
  settings,
}: {
  settings: StoreSettingsResponseDto
}) {
  const queryClient = useQueryClient()
  const form = useForm<FormInput>({
    resolver: zodResolver(addressSettingsSchema),
    defaultValues: buildAddressDefaults(settings),
  })

  const { isPending, mutate } = useMutation({
    ...getUpdateStoreSettingsMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تحديث العنوان")
      },
    }),
  })

  const handleSubmit = (data: FormInput) => {
    const payload: UpdateStoreSettingsInput = {}
    const initial = buildAddressDefaults(settings)
    if ((data.governorate ?? "") !== initial.governorate)
      payload.governorate = data.governorate ?? ""
    if ((data.city ?? "") !== initial.city) payload.city = data.city ?? ""
    if ((data.street ?? "") !== initial.street)
      payload.street = data.street ?? ""

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
          <CardTitle>عنوان المتجر</CardTitle>
          <CardDescription>
            عنوان النشاط التجاري الذي يظهر في صفحة الاتصال والفواتير.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-3">
          <UiField data-invalid={Boolean(form.formState.errors.governorate)}>
            <FieldLabel htmlFor="governorate">المحافظة</FieldLabel>
            <Controller
              name="governorate"
              control={form.control}
              render={({ field }) => (
                <Input {...field} id="governorate" placeholder="دمشق" />
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
                <Input {...field} id="city" placeholder="دمشق" />
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
                <Input {...field} id="street" placeholder="الحمراء" />
              )}
            />
            <FieldError errors={[form.formState.errors.street]} />
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
