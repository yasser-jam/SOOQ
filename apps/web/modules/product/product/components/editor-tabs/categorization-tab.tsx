"use client"

import { useFormContext } from "react-hook-form"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import CategorySelect from "@/modules/product/category/components/select"
import CreatableCategorySelect from "@/modules/product/category/components/creatable-category-select"
import CreatableTagSelect from "@/modules/product/tag/components/creatable-tag-select"

type Props = {
  isSubmitting: boolean
}

export default function CategorizationTab({ isSubmitting }: Props) {
  const form = useFormContext()

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="border-2">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="text-xl font-semibold">الفئات</CardTitle>
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
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="text-xl font-semibold">الوسوم</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <CreatableTagSelect
            name="tags"
            control={form.control}
            label="الوسوم"
            placeholder="اختر الوسوم"
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  )
}
