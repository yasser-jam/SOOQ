"use client"

import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
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
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react"
import * as React from "react"
import { useFormContext } from "react-hook-form"
import { toast } from "sonner"

import { uploadMedia } from "@/modules/media/upload/actions"
import { validateImageFile } from "@/modules/media/upload/init"
import { MEDIA_CONSTRAINTS } from "@/modules/media/upload/types"

import type { AllSettingsInput, StoreSettingsResponseDto } from "../types"

const ACCEPT_ATTR = MEDIA_CONSTRAINTS.allowedTypes.join(",")

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

type ImageFieldName = "logoUrl" | "faviconUrl"

function ImageUploadField({
  fieldName,
  label,
  previewSize,
  helperText,
}: {
  fieldName: ImageFieldName
  label: string
  previewSize?: string
  helperText?: string
}) {
  const form = useFormContext<AllSettingsInput>()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const value = form.watch(fieldName)
  const error = form.formState.errors[fieldName]

  const { isPending, mutate } = useMutation({
    mutationFn: uploadMedia,
    onSuccess: (response) => {
      const uploaded = response.items[0]
      if (!uploaded) {
        toast.error("لم يتم استلام رابط الصورة من الخادم")
        return
      }
      form.setValue(fieldName, uploaded.publicUrl, {
        shouldDirty: true,
        shouldValidate: true,
      })
      toast.success("تم رفع الصورة")
    },
    onError: () => {
      // The axios interceptor already surfaces the error toast.
    },
  })

  const pickFile = () => inputRef.current?.click()

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Reset so picking the same file twice re-fires onChange.
    event.target.value = ""
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.ok) {
      toast.error(validation.error)
      return
    }
    mutate([file])
  }

  const clear = () => {
    form.setValue(fieldName, "", {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <div className="flex items-start gap-4">
      <ImagePreview url={value ?? ""} alt={label} size={previewSize} />
      <UiField className="flex-1" data-invalid={Boolean(error)}>
        <FieldLabel>{label}</FieldLabel>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={onFileChange}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={pickFile}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {value ? "استبدال الصورة" : "اختر صورة"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clear}
              disabled={isPending}
            >
              <Trash2 className="size-4 text-destructive" />
              إزالة
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {helperText ?? "JPG أو PNG أو WebP، حتى 5 ميغابايت."}
        </p>
        {value && (
          <p
            className="truncate text-xs text-muted-foreground"
            title={value}
            dir="ltr"
          >
            {value}
          </p>
        )}
        <FieldError errors={[error]} />
      </UiField>
    </div>
  )
}

export default function BrandingTab({
  settings: _settings,
}: {
  settings: StoreSettingsResponseDto
}) {
  return (
    <Card className="rounded-2xl border-gray-200/50 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[#1e3a47]">الشعار والـ favicon</CardTitle>
        <CardDescription className="text-sm text-gray-600 font-medium">
          اختر الصورة من جهازك. سيتم رفعها فوراً وحفظ رابطها عند الضغط
          على «حفظ كل الإعدادات».
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <ImageUploadField fieldName="logoUrl" label="شعار المتجر" />
        <ImageUploadField
          fieldName="faviconUrl"
          label="Favicon"
          previewSize="size-12"
          helperText="صورة صغيرة (32×32 أو 64×64) تظهر في علامة تبويب المتصفح."
        />
      </CardContent>
    </Card>
  )
}
