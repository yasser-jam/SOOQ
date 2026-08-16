"use client"

import { useEffect, useRef, useState } from "react"
import { Controller, useFormContext, useWatch } from "react-hook-form"
import { Pencil, RotateCcw } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"

import Field from "@/components/system/Field"
import Textarea from "@/components/system/textarea"
import SysSwitch from "@/components/system/switch"

type Props = {
  isSubmitting: boolean
  isEdit?: boolean
}

function toSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .slice(0, 100)
}

export default function BasicInfoSection({ isSubmitting, isEdit }: Props) {
  const form = useFormContext()
  const prevTitleEn = useRef("")

  const titleEn =
    (useWatch({ control: form.control, name: "titleEn" }) as string) ?? ""

  useEffect(() => {
    if (isEdit) return
    if (titleEn === prevTitleEn.current) return
    prevTitleEn.current = titleEn
    form.setValue("slug", toSlug(titleEn), { shouldDirty: false })
  }, [titleEn, form])

  return (
    <Card>
      <CardHeader>
        <CardTitle>المعلومات الأساسية</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <Field
          name="titleAr"
          control={form.control}
          label="العنوان بالعربية"
          placeholder="مثال: هاتف ذكي 128GB"
          inputProps={{ disabled: isSubmitting }}
        />

        <Field
          name="titleEn"
          control={form.control}
          label="العنوان بالإنجليزية"
          placeholder="Example: Smartphone 128GB"
          inputProps={{ disabled: isSubmitting }}
        />

        <Textarea
          name="descriptionAr"
          control={form.control}
          label="وصف عربي"
          placeholder="مثال: شاشة 6.5 إنش، بطارية 5000mAh، ضمان سنة"
          textareaProps={{ disabled: isSubmitting, rows: 3 }}
        />

        <Textarea
          name="descriptionEn"
          control={form.control}
          label="وصف إنجليزي"
          placeholder="Example: 6.5-inch display, 5000mAh battery, 1-year warranty"
          textareaProps={{ disabled: isSubmitting, rows: 3 }}
        />

        {/* Slug with auto-gen */}
        <UiField className="col-span-2" data-invalid={Boolean(form.formState.errors.slug)}>
          <Field
            name="slug"
            control={form.control}
            label="الرابط"
            placeholder="your-product-slug"
            inputProps={{
              disabled: isSubmitting,
            }}
          />
          <FieldError errors={[form.formState.errors.slug]} />
        </UiField>

        {/* Status */}
        <Controller
          name="status"
          control={form.control}
          render={({ field, fieldState }) => (
            <UiField className="col-span-2" data-invalid={fieldState.invalid}>
              <SysSwitch
                label="حالة المنتج"
                description={
                  field.value === "ARCHIVED"
                    ? "المنتج مؤرشف"
                    : field.value === "ACTIVE"
                      ? "المنتج منشور ومرئي للعملاء"
                      : "المنتج مسودة وغير مرئي للعملاء"
                }
                value={field.value === "ACTIVE"}
                onChange={(checked) =>
                  field.onChange(checked ? "ACTIVE" : "DRAFT")
                }
                disabled={isSubmitting || field.value === "ARCHIVED"}
              />
              <FieldError errors={[fieldState.error]} />
            </UiField>
          )}
        />
      </CardContent>
    </Card>
  )
}
