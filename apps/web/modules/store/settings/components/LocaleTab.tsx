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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { getUpdateStoreSettingsMutationOptions } from "../actions"
import { TIMEZONE_OPTIONS, buildLocaleDefaults } from "../init"
import { localeSettingsSchema } from "../schema"
import type { StoreSettingsResponseDto, UpdateStoreSettingsInput } from "../types"

type FormInput = z.infer<typeof localeSettingsSchema>

export default function LocaleTab({
  settings,
}: {
  settings: StoreSettingsResponseDto
}) {
  const queryClient = useQueryClient()
  const form = useForm<FormInput>({
    resolver: zodResolver(localeSettingsSchema),
    defaultValues: buildLocaleDefaults(settings),
  })

  const { isPending, mutate } = useMutation({
    ...getUpdateStoreSettingsMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تحديث المنطقة الزمنية")
      },
    }),
  })

  const handleSubmit = (data: FormInput) => {
    const initial = buildLocaleDefaults(settings)
    if (data.timezone === initial.timezone) {
      toast.info("لا تغييرات للحفظ")
      return
    }
    const payload: UpdateStoreSettingsInput = { timezone: data.timezone }
    mutate(payload)
  }

  return (
    <Card>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardHeader>
          <CardTitle>المنطقة الزمنية</CardTitle>
          <CardDescription>
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

        <CardFooter className="justify-end">
          <Button type="submit" loading={isPending}>
            حفظ
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
