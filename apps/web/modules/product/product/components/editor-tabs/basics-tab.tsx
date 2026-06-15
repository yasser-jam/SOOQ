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
import CurrencySelect from "@/modules/product/product/components/currency-select"
import StatusSelect from "@/modules/product/product/components/status-select"
import CategorySelect from "@/modules/product/category/components/select"
import CreatableCategorySelect from "@/modules/product/category/components/creatable-category-select"
import CreatableTagSelect from "@/modules/product/tag/components/creatable-tag-select"

type Props = {
  isSubmitting: boolean
}

export default function BasicsTab({ isSubmitting }: Props) {
  const form = useFormContext()
  const [languageTab, setLanguageTab] = useState("ar")

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-2">
        <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50">
          <CardTitle className="text-xl font-semibold">معلومات المنتج</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={languageTab} onValueChange={setLanguageTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger 
                value="ar" 
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                العربية
              </TabsTrigger>
              <TabsTrigger 
                value="en"
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
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

      <Card className="border-2">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="text-xl font-semibold">الفئات والوسوم</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <CategorySelect
              name="defaultCategoryId"
              control={form.control}
              label="الفئة الافتراضية"
              placeholder="اختر الفئة الافتراضية"
              disabled={isSubmitting}
              description="إذا لم تحدد فئة افتراضية، ستصبح أول فئة في القائمة هي الافتراضية تلقائياً"
            />

            <CreatableCategorySelect
              name="categories"
              control={form.control}
              label="الفئات"
              placeholder="اختر الفئات"
              disabled={isSubmitting}
            />

            <CreatableTagSelect
              name="tags"
              control={form.control}
              label="الوسوم"
              placeholder="اختر الوسوم"
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-xl font-semibold">التسعير</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Field
              name="basePrice"
              control={form.control}
              label="السعر الأساسي"
              inputProps={{
                disabled: isSubmitting,
                type: "number",
                min: 0,
              }}
            />

            <Field
              name="compareAtPrice"
              control={form.control}
              label="سعر المقارنة (يظهر شطباً على الواجهة)"
              inputProps={{
                disabled: isSubmitting,
                type: "number",
                min: 0,
              }}
            />

            <UiField
              data-invalid={Boolean(form.formState.errors.currencyCode)}
            >
              <FieldLabel htmlFor="currencyCode">العملة</FieldLabel>
              <Controller
                name="currencyCode"
                control={form.control}
                render={({ field }) => (
                  <CurrencySelect
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.currencyCode]} />
            </UiField>

            <UiField
              data-invalid={Boolean(form.formState.errors.allowOversell)}
              className="rounded-lg border p-4 bg-gray-50"
            >
              <FieldLabel
                htmlFor="allowOversell"
                className="flex w-full items-center gap-3 cursor-pointer"
              >
                <input
                  id="allowOversell"
                  type="checkbox"
                  {...form.register("allowOversell")}
                  disabled={isSubmitting}
                  className="size-4"
                />
                <div className="flex flex-col gap-1">
                  <span className="font-medium">السماح بالبيع عند نفاد المخزون</span>
                  <span className="text-sm text-gray-500">
                    عند تفعيل هذا الخيار، يمكن للعملاء طلب المنتج حتى لو نفد المخزون
                  </span>
                </div>
              </FieldLabel>
              <FieldError errors={[form.formState.errors.allowOversell]} />
            </UiField>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
