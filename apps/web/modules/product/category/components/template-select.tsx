"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Field as UiField,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"

import { getCategoryTemplates, productCategoryKeys } from "../actions"

/**
 * Phase 5 (PRD): "بدون قالب" sentinel. Radix `SelectItem` disallows empty
 * string values, so we use this constant for the UI-side "no selection"
 * choice. [[initCategoryPayload]] strips it back to `undefined` before the
 * payload reaches the backend.
 */
const NONE_VALUE = "__none__"

type CategoryTemplateSelectProps<T extends FieldValues> = {
  name: FieldPath<T>
  control: Control<T>
  disabled?: boolean
}

export default function CategoryTemplateSelect<T extends FieldValues>({
  name,
  control,
  disabled,
}: CategoryTemplateSelectProps<T>) {
  const fieldId = String(name)

  const { data: templates, isPending } = useQuery({
    queryKey: productCategoryKeys.templates(),
    queryFn: getCategoryTemplates,
    // Backend keeps the template library code-defined; it only changes
    // between releases. Treat it as effectively immutable per session.
    staleTime: Infinity,
  })

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <UiField data-invalid={fieldState.invalid}>
          <FieldLabel>قالب ابتدائي (اختياري)</FieldLabel>
          <Select
            value={(field.value as string | undefined) ?? NONE_VALUE}
            onValueChange={field.onChange}
            disabled={disabled || isPending}
          >
            <SelectTrigger
              id={fieldId}
              aria-invalid={fieldState.invalid || undefined}
              className="h-11 w-full"
            >
              <SelectValue placeholder="اختر قالباً ابتدائياً" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={NONE_VALUE}>بدون قالب</SelectItem>
                {templates?.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    <span>
                      {t.labelAr} — {t.labelEn}
                    </span>
                    {t.attributeKeys.length > 0 ? (
                      <span className="ms-2 text-xs text-muted-foreground">
                        ({t.attributeKeys.join(", ")})
                      </span>
                    ) : null}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>
            يضيف مجموعة سمات افتراضية للفئة (يمكنك تعديلها لاحقاً)
          </FieldDescription>
          <FieldError errors={[fieldState.error]} />
        </UiField>
      )}
    />
  )
}
