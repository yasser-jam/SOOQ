"use client"

import { useMemo } from "react"
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

import { listProductCategories, productCategoryKeys } from "../actions"
import { ProductCategory } from "../types"

const NONE_VALUE = "__none__"

type FlattenedCategory = {
  id: string
  nameAr: string
  depth: number
}

const getCategoryId = (category: ProductCategory): string =>
  (category.id ?? category.categoryId ?? "").trim()

const getCategoryChildren = (category: ProductCategory): ProductCategory[] => {
  const children = category.children
  return Array.isArray(children) ? (children as ProductCategory[]) : []
}

const flattenCategoryTree = (
  categories: ProductCategory[],
  depth = 0
): FlattenedCategory[] =>
  (categories ?? []).flatMap((category) => {
    const id = getCategoryId(category)
    const current: FlattenedCategory | null = id
      ? { id, nameAr: category.nameAr, depth }
      : null

    return [
      ...(current ? [current] : []),
      ...flattenCategoryTree(getCategoryChildren(category), depth + 1),
    ]
  })

type CategorySelectProps<T extends FieldValues> = {
  name: FieldPath<T>
  control: Control<T>
  label: React.ReactNode
  placeholder?: string
  disabled?: boolean
  allowNone?: boolean
  noneLabel?: string
  /**
   * Optional helper text rendered under the select. Used by the product
   * editor to explain the "first category becomes default if unset" fallback
   * — kept opt-in so callers reusing this select (e.g. the attributes page)
   * don't inherit a misleading caption.
   */
  description?: React.ReactNode
}

export default function CategorySelect<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "اختر الفئة",
  disabled,
  allowNone = false,
  noneLabel = "بدون فئة أم",
  description,
}: CategorySelectProps<T>) {
  const fieldId = String(name)

  const { data: categories, isPending } = useQuery({
    queryKey: productCategoryKeys.all,
    queryFn: listProductCategories,
  })

  const flatCategories = useMemo(
    () => flattenCategoryTree(categories ?? []),
    [categories]
  )

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const value =
          allowNone && (field.value == null || field.value === "")
            ? NONE_VALUE
            : String(field.value ?? "")

        return (
          <UiField data-invalid={fieldState.invalid}>
            <FieldLabel>{label}</FieldLabel>
            <Select
              value={value}
              onValueChange={(next) =>
                field.onChange(
                  allowNone && next === NONE_VALUE ? null : next
                )
              }
              disabled={disabled || isPending}
            >
              <SelectTrigger
                id={fieldId}
                aria-invalid={fieldState.invalid || undefined}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  {allowNone && (
                    <SelectItem value={NONE_VALUE}>{noneLabel}</SelectItem>
                  )}
                  {flatCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span
                        style={{ paddingInlineStart: category.depth * 16 }}
                      >
                        {category.nameAr}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError errors={[fieldState.error]} />
          </UiField>
        )
      }}
    />
  )
}
