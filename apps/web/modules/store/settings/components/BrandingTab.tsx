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
import { ImageIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { getUpdateStoreSettingsMutationOptions } from "../actions"
import { buildBrandingDefaults } from "../init"
import { brandingSettingsSchema } from "../schema"
import type { StoreSettingsResponseDto, UpdateStoreSettingsInput } from "../types"

type FormInput = z.infer<typeof brandingSettingsSchema>

function ImagePreview({
  url,
  alt,
  size = "size-24",
}: {
  url: string
  alt: string
  size?: string
}) {
  if (!url) {
    return (
      <div
        className={`${size} flex items-center justify-center rounded-md border border-dashed bg-muted/30 text-muted-foreground`}
      >
        <ImageIcon className="size-6" />
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={`${size} rounded-md object-contain border bg-muted/30`}
    />
  )
}

export default function BrandingTab({
  settings,
}: {
  settings: StoreSettingsResponseDto
}) {
  const queryClient = useQueryClient()
  const form = useForm<FormInput>({
    resolver: zodResolver(brandingSettingsSchema),
    defaultValues: buildBrandingDefaults(settings),
  })

  const logoUrl = form.watch("logoUrl")
  const faviconUrl = form.watch("faviconUrl")

  const { isPending, mutate } = useMutation({
    ...getUpdateStoreSettingsMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تحديث الشعار")
      },
    }),
  })

  const handleSubmit = (data: FormInput) => {
    const payload: UpdateStoreSettingsInput = {}
    const initial = buildBrandingDefaults(settings)
    if ((data.logoUrl ?? "") !== initial.logoUrl)
      payload.logoUrl = data.logoUrl ?? ""
    if ((data.faviconUrl ?? "") !== initial.faviconUrl)
      payload.faviconUrl = data.faviconUrl ?? ""

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
          <CardTitle>الشعار والـ favicon</CardTitle>
          <CardDescription>
            ألصق رابط الصورة (https). تظهر المعاينة فور كتابة الرابط.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <ImagePreview url={logoUrl ?? ""} alt="logo" />
            <UiField
              className="flex-1"
              data-invalid={Boolean(form.formState.errors.logoUrl)}
            >
              <FieldLabel htmlFor="logoUrl">رابط الشعار</FieldLabel>
              <Controller
                name="logoUrl"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="logoUrl"
                    type="url"
                    placeholder="https://cdn.example.com/logo.png"
                    dir="ltr"
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.logoUrl]} />
            </UiField>
          </div>

          <div className="flex items-start gap-4">
            <ImagePreview url={faviconUrl ?? ""} alt="favicon" size="size-12" />
            <UiField
              className="flex-1"
              data-invalid={Boolean(form.formState.errors.faviconUrl)}
            >
              <FieldLabel htmlFor="faviconUrl">رابط Favicon</FieldLabel>
              <Controller
                name="faviconUrl"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="faviconUrl"
                    type="url"
                    placeholder="https://cdn.example.com/favicon.png"
                    dir="ltr"
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.faviconUrl]} />
            </UiField>
          </div>
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
