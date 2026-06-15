"use client"

import { useFormContext, useWatch } from "react-hook-form"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import Field from "@/components/system/Field"
import Textarea from "@/components/system/textarea"

type Props = {
  isSubmitting: boolean
}

/**
 * SEO tab — moved inline per spec (PRD-013). Was previously a separate route at
 * /products/[product-id]/seo (kept as redirect shim for one release).
 */
export default function SeoTab({ isSubmitting }: Props) {
  const form = useFormContext()
  const slug = useWatch({ control: form.control, name: "slug" }) ?? ""

  return (
    <Card className="border-2">
      <CardHeader className="border-b bg-gradient-to-r from-violet-50 to-purple-50">
        <CardTitle className="text-xl font-semibold">إعدادات SEO</CardTitle>
        <CardDescription>
          هذه الحقول تظهر في نتائج محرّكات البحث وعلى وسائل التواصل عند مشاركة
          صفحة المنتج.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <Field
            name="seoTitle"
            control={form.control}
            label="عنوان SEO"
            placeholder="مثال: اشترِ هاتف ذكي 128GB بأفضل سعر"
            inputProps={{ disabled: isSubmitting }}
          />

          <Textarea
            name="seoDescription"
            control={form.control}
            label="وصف SEO"
            placeholder="مثال: هاتف ذكي بشاشة عالية الدقة وبطارية طويلة الأمد مع ضمان وتوصيل سريع"
            textareaProps={{ disabled: isSubmitting, rows: 4 }}
          />

          <div className="rounded-lg border-2 border-dashed bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              معاينة الرابط
            </p>
            <p className="mt-1 text-sm break-all" dir="ltr">
              /products/{slug || "your-product-slug"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
