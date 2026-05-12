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
import { Textarea } from "@workspace/ui/components/textarea"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import PhoneField from "@/components/system/PhoneField"
import { getUpdateStoreSettingsMutationOptions } from "../actions"
import { buildGeneralDefaults } from "../init"
import { generalSettingsSchema } from "../schema"
import type { StoreSettingsResponseDto, UpdateStoreSettingsInput } from "../types"

type FormInput = z.infer<typeof generalSettingsSchema>

export default function GeneralTab({
  settings,
}: {
  settings: StoreSettingsResponseDto
}) {
  const queryClient = useQueryClient()
  const form = useForm<FormInput>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: buildGeneralDefaults(settings),
  })

  const { isPending, mutate } = useMutation({
    ...getUpdateStoreSettingsMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تحديث الملف العام")
      },
    }),
  })

  const handleSubmit = (data: FormInput) => {
    const payload: UpdateStoreSettingsInput = {}
    const initial = buildGeneralDefaults(settings)
    if ((data.profileNameAr ?? "") !== initial.profileNameAr)
      payload.profileNameAr = data.profileNameAr ?? ""
    if ((data.profileNameEn ?? "") !== initial.profileNameEn)
      payload.profileNameEn = data.profileNameEn ?? ""
    if ((data.profileDescription ?? "") !== initial.profileDescription)
      payload.profileDescription = data.profileDescription ?? ""
    if ((data.contactEmail ?? "") !== initial.contactEmail)
      payload.contactEmail = data.contactEmail ?? ""
    if ((data.contactPhone ?? "") !== initial.contactPhone)
      payload.contactPhone = data.contactPhone ?? ""

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

        <CardFooter className="justify-end">
          <Button type="submit" loading={isPending}>
            حفظ
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
