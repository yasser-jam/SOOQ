"use client"

import { useFormContext } from "react-hook-form"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { FieldError } from "@workspace/ui/components/field"

import CategorySelect from "@/modules/product/category/components/select"
import ProductMultipleCategorySelect from "@/modules/product/category/components/multiple-category-select"
import TagMultiSelect from "@/modules/product/tag/components/multi-select"

type Props = {
  isSubmitting: boolean
}

export default function CategorizationTab({ isSubmitting }: Props) {
  const form = useFormContext()

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">الفئات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <CategorySelect
              name="defaultCategoryId"
              control={form.control}
              label="الفئة الافتراضية"
              placeholder="اختر الفئة الافتراضية"
              disabled={isSubmitting}
            />

            <ProductMultipleCategorySelect
              name="categoryIds"
              control={form.control}
              label="الفئات"
              placeholder="اختر الفئات"
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">الوسوم</CardTitle>
        </CardHeader>
        <CardContent>
          <TagMultiSelect
            control={form.control}
            name="tagIds"
            label="الوسوم"
          />
          <FieldError errors={[form.formState.errors.tagIds]} />
        </CardContent>
      </Card>
    </div>
  )
}
