"use client"

import { useMutation } from "@tanstack/react-query"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import * as React from "react"
import { useFormContext } from "react-hook-form"
import { toast } from "sonner"

import ImageUploader, {
  type ImageUploaderState,
} from "@/components/system/image-uploader"
import { uploadMedia } from "@/modules/media/upload/actions"
import { validateImageFile } from "@/modules/media/upload/init"
import { MEDIA_CONSTRAINTS } from "@/modules/media/upload/types"

import type { AllSettingsInput } from "../types"
import {
  SettingsCard,
  SettingsCardContent,
  SettingsCardDescription,
  SettingsCardHeader,
  SettingsCardTitle,
} from "./SettingsCard"

const ACCEPT_ATTR = MEDIA_CONSTRAINTS.allowedTypes.join(",")

type ImageFieldName = "logoUrl" | "faviconUrl"

function BrandingImageField({
  fieldName,
  label,
  helperText,
}: {
  fieldName: ImageFieldName
  label: string
  helperText?: string
}) {
  const form = useFormContext<AllSettingsInput>()
  const value = form.watch(fieldName) ?? ""
  const error = form.formState.errors[fieldName]
  const uploadingFileKeyRef = React.useRef<string | null>(null)

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

  const handleChange = React.useCallback(
    (state: ImageUploaderState) => {
      if (state.keptExistingIds.length === 0 && state.newFiles.length === 0) {
        form.setValue(fieldName, "", {
          shouldDirty: true,
          shouldValidate: true,
        })
        return
      }

      const file = state.newFiles.at(-1)
      if (!file) return

      const fileKey = `${file.name}-${file.size}-${file.lastModified}`
      if (uploadingFileKeyRef.current === fileKey || isPending) return
      uploadingFileKeyRef.current = fileKey

      const validation = validateImageFile(file)
      if (!validation.ok) {
        toast.error(validation.error)
        uploadingFileKeyRef.current = null
        return
      }

      mutate([file], {
        onSettled: () => {
          uploadingFileKeyRef.current = null
        },
      })
    },
    [fieldName, form, isPending, mutate]
  )

  const existing = React.useMemo(
    () => (value ? [{ id: fieldName, url: value }] : []),
    [fieldName, value]
  )

  return (
    <UiField data-invalid={Boolean(error)}>
      <FieldLabel>{label}</FieldLabel>
      <ImageUploader
        key={value || `${fieldName}-empty`}
        existing={existing}
        maxFiles={1}
        maxSize={MEDIA_CONSTRAINTS.maxBytes}
        accept={ACCEPT_ATTR}
        onChange={handleChange}
        disabled={isPending}
        replaceMode
        showPrimaryBadge={false}
        showRemainingCount={false}
        subHint={null}
        dropzoneTitle={value ? "استبدال الصورة" : "رفع الصورة"}
        formatHint={helperText ?? "JPG أو PNG أو WebP، حتى 5 ميغابايت."}
        triggerLabel={value ? "استبدال الصورة" : "اختر صورة"}
        existingLabel="الصورة الحالية"
      />
      {value ? (
        <p
          className="truncate text-xs text-muted-foreground"
          title={value}
          dir="ltr"
        >
          {value}
        </p>
      ) : null}
      <FieldError errors={[error]} />
    </UiField>
  )
}

export default function BrandingTab() {
  return (
    <SettingsCard>
      <SettingsCardHeader>
        <SettingsCardTitle>الشعار والـ favicon</SettingsCardTitle>
        <SettingsCardDescription>
          اختر الصورة من جهازك. سيتم رفعها فوراً وحفظ رابطها عند الضغط
          على «حفظ كل الإعدادات».
        </SettingsCardDescription>
      </SettingsCardHeader>

      <SettingsCardContent className="flex flex-col gap-6">
        <BrandingImageField fieldName="logoUrl" label="شعار المتجر" />
        <BrandingImageField
          fieldName="faviconUrl"
          label="Favicon"
          helperText="صورة صغيرة (32×32 أو 64×64) تظهر في علامة تبويب المتصفح."
        />
      </SettingsCardContent>
    </SettingsCard>
  )
}
