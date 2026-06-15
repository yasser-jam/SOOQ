"use client"

import { useState } from "react"
import { Controller, useFormContext } from "react-hook-form"

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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/system/tabs"

import Field from "@/components/system/Field"
import Textarea from "@/components/system/textarea"
import StatusSelect from "@/modules/product/product/components/status-select"

type Props = {
  isSubmitting: boolean
}

export default function BasicInfoSection({ isSubmitting }: Props) {
  const form = useFormContext()
  const [languageTab, setLanguageTab] = useState("ar")

  return (
    <Card className="border-2 bg-white" style={{ borderColor: "#E5E7EB" }}>
      <CardHeader className="border-b" style={{ borderColor: "#E5E7EB" }}>
        <CardTitle className="text-xl font-bold" style={{ color: "#122640" }}>
          المعلومات الأساسية
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={languageTab} onValueChange={setLanguageTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger
              value="ar"
              className="data-[state=active]:text-white"
              style={
                languageTab === "ar"
                  ? { backgroundColor: "#BA7B1B" }
                  : undefined
              }
            >
              العربية
            </TabsTrigger>
            <TabsTrigger
              value="en"
              className="data-[state=active]:text-white"
              style={
                languageTab === "en"
                  ? { backgroundColor: "#BA7B1B" }
                  : undefined
              }
            >
              الإنجليزية
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ar" className="space-y-4">
            <Field
              name="titleAr"
              control={form.control}
              label="العنوان"
              placeholder="مثال: هاتف ذكي 128GB"
              inputProps={{ disabled: isSubmitting }}
            />

            <Textarea
              name="descriptionAr"
              control={form.control}
              label="وصف المنتج"
              placeholder="مثال: شاشة 6.5 إنش، بطارية 5000mAh، ضمان سنة"
              textareaProps={{ disabled: isSubmitting, rows: 4 }}
            />

            <UiField data-invalid={Boolean(form.formState.errors.status)}>
              <FieldLabel htmlFor="status">حالة المنتج</FieldLabel>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <StatusSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.status]} />
            </UiField>

            <Field
              name="slug"
              control={form.control}
              label="الرابط"
              placeholder="مثال: smartphone-128gb"
              inputProps={{ disabled: isSubmitting }}
            />
          </TabsContent>

          <TabsContent value="en" className="space-y-4">
            <Field
              name="titleEn"
              control={form.control}
              label="العنوان"
              placeholder="Example: Smartphone 128GB"
              inputProps={{ disabled: isSubmitting }}
            />

            <Textarea
              name="descriptionEn"
              control={form.control}
              label="وصف المنتج"
              placeholder="Example: 6.5-inch display, 5000mAh battery, 1-year warranty"
              textareaProps={{ disabled: isSubmitting, rows: 4 }}
            />

            <UiField data-invalid={Boolean(form.formState.errors.status)}>
              <FieldLabel htmlFor="status">حالة المنتج</FieldLabel>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <StatusSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.status]} />
            </UiField>

            <Field
              name="slug"
              control={form.control}
              label="الرابط"
              placeholder="مثال: smartphone-128gb"
              inputProps={{ disabled: isSubmitting }}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
