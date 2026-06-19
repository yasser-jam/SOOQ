"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Plus, Trash2 } from "lucide-react"
import { Controller, useFieldArray, useFormContext } from "react-hook-form"

import { SOCIAL_PLATFORMS } from "../init"
import type { AllSettingsInput } from "../types"
import {
  SettingsCard,
  SettingsCardContent,
  SettingsCardDescription,
  SettingsCardHeader,
  SettingsCardTitle,
} from "./SettingsCard"

export default function SocialLinksTab() {
  const form = useFormContext<AllSettingsInput>()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "socialLinks",
  })

  const handleAddRow = () => {
    const defaultPlatform = SOCIAL_PLATFORMS[0]!
    append({
      label: defaultPlatform.label,
      url: "",
      platform: defaultPlatform.value,
      icon: defaultPlatform.icon,
    })
  }

  return (
    <SettingsCard>
      <SettingsCardHeader>
        <SettingsCardTitle>روابط التواصل الاجتماعي</SettingsCardTitle>
        <SettingsCardDescription>
          تظهر في تذييل صفحة المتجر وصفحة الاتصال.
        </SettingsCardDescription>
      </SettingsCardHeader>

      <SettingsCardContent className="flex flex-col gap-4">
        {fields.length === 0 && (
          <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            لا توجد روابط بعد. اضغط على «إضافة رابط» للبدء.
          </div>
        )}

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-[1fr_1fr_2fr_auto]"
          >
            <UiField
              data-invalid={Boolean(
                form.formState.errors.socialLinks?.[index]?.platform
              )}
            >
              <FieldLabel>المنصة</FieldLabel>
              <Controller
                name={`socialLinks.${index}.platform`}
                control={form.control}
                render={({ field: f }) => (
                  <Select
                    value={f.value}
                    onValueChange={(value) => {
                      const platform = SOCIAL_PLATFORMS.find(
                        (p) => p.value === value
                      )
                      f.onChange(value)
                      if (platform) {
                        form.setValue(
                          `socialLinks.${index}.icon`,
                          platform.icon
                        )
                        const currentLabel = form.getValues(
                          `socialLinks.${index}.label`
                        )
                        if (!currentLabel) {
                          form.setValue(
                            `socialLinks.${index}.label`,
                            platform.label
                          )
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOCIAL_PLATFORMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </UiField>

            <UiField
              data-invalid={Boolean(
                form.formState.errors.socialLinks?.[index]?.label
              )}
            >
              <FieldLabel>التسمية</FieldLabel>
              <Controller
                name={`socialLinks.${index}.label`}
                control={form.control}
                render={({ field: f }) => (
                  <Input {...f} placeholder="مثال: تابعنا على إنستغرام" />
                )}
              />
              <FieldError
                errors={[form.formState.errors.socialLinks?.[index]?.label]}
              />
            </UiField>

            <UiField
              data-invalid={Boolean(
                form.formState.errors.socialLinks?.[index]?.url
              )}
            >
              <FieldLabel>الرابط</FieldLabel>
              <Controller
                name={`socialLinks.${index}.url`}
                control={form.control}
                render={({ field: f }) => (
                  <Input
                    {...f}
                    type="url"
                    placeholder="https://..."
                    dir="ltr"
                  />
                )}
              />
              <FieldError
                errors={[form.formState.errors.socialLinks?.[index]?.url]}
              />
            </UiField>

            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                aria-label="حذف الرابط"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}

        <div>
          <Button type="button" variant="outline" onClick={handleAddRow}>
            <Plus className="size-4" />
            إضافة رابط
          </Button>
        </div>
      </SettingsCardContent>
    </SettingsCard>
  )
}
