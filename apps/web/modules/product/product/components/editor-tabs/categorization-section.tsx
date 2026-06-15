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

export default function CategorizationSection({ isSubmitting }: Props) {
  const form = useFormContext()

  return (
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
  )
}
