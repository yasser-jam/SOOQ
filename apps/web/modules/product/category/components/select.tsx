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
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"

import { listProductCategories, productCategoryKeys } from "../actions"

type CategorySelectProps<T extends FieldValues> = {
  name: FieldPath<T>
  control: Control<T>
  label: React.ReactNode
  placeholder?: string
  disabled?: boolean
}

export default function CategorySelect<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "اختر الفئة",
  disabled,
}: CategorySelectProps<T>) {
  const fieldId = String(name)

  const { data: categories, isPending } = useQuery({
    queryKey: productCategoryKeys.all,
    queryFn: listProductCategories,
  })

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const value = field.value

        return (
          <UiField data-invalid={fieldState.invalid}>
            <FieldLabel>{label}</FieldLabel>
            <Select
              value={value}
              onValueChange={field.onChange}
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
                  {categories?.length &&
                    categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={String(category.id ?? "")}
                        disabled={!category.id}
                      >
                        {category.nameAr}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </UiField>
        )
      }}
    />
  )
}
