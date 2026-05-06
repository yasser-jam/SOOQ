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

import { listProductTags } from "../actions"
import { listProductCategories } from "../../category/actions"
import MultiSelect from "@/components/system/multi-select"
import { ProductTag } from "../types"
import { tagQueryKeys } from "../queryKeys"

type CategorySelectProps<T extends FieldValues> = {
  name: FieldPath<T>
  control: Control<T>
  label: React.ReactNode
  placeholder?: string
  disabled?: boolean
}

export default function TagMultiSelect<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "اختر الفئة",
  disabled,
}: CategorySelectProps<T>) {
  const fieldId = String(name)

  const { data: tags, isPending } = useQuery<ProductTag[]>({
    queryKey: tagQueryKeys.all,
    queryFn: listProductTags,
  })

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        return (
          <UiField data-invalid={fieldState.invalid}>
            <FieldLabel>{label}</FieldLabel>
            <MultiSelect
              items={tags || []}
              itemTitle="tagName"
              itemValue="id"
              placeholder="اختر الوسوم"
              loading={isPending}
              {...field}
            ></MultiSelect>

            <FieldError errors={[fieldState.error]} />
          </UiField>
        )
      }}
    />
  )
}
