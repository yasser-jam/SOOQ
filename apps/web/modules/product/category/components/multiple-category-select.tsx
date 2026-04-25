"use client"

import { useMemo, useState } from "react"

import { useQuery } from "@tanstack/react-query"
import { ChevronDown, Loader2 } from "lucide-react"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Field as UiField,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

import {
  getProductCategory,
  listProductCategories,
  productCategoryKeys,
} from "../actions"
import {
  buildCategoryNameMap,
  filterCategoryTree,
} from "./category-select.utils"

type ProductMultipleCategorySelectProps<T extends FieldValues> = {
  name: FieldPath<T>
  control: Control<T>
  label: string
  placeholder?: string
  initialValues?: Array<string | null | undefined>
  excludedCategoryIds?: Array<string | null | undefined>
  disabled?: boolean
  emptyLabel?: string
  subrowKeys?: string
}

type CategoryNode = {
  id?: string | null
  nameAr: string
  [subrowKey: string]: unknown
}

const normalizeSelectedValues = (values: unknown): string[] => {
  if (!Array.isArray(values)) return []

  return values.filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0
  )
}

const getCategoryChildren = (
  category: CategoryNode,
  subrowKeys?: string
): CategoryNode[] => {
  if (!subrowKeys) return []

  const nestedValue = category[subrowKeys]
  return Array.isArray(nestedValue) ? (nestedValue as CategoryNode[]) : []
}

const flattenCategoryTree = (
  categories: CategoryNode[],
  subrowKeys?: string,
  depth = 0
): Array<{ category: CategoryNode; depth: number }> => {
  return categories.flatMap((category) => {
    const children = getCategoryChildren(category, subrowKeys)
    return [
      { category, depth },
      ...flattenCategoryTree(children, subrowKeys, depth + 1),
    ]
  })
}

export default function ProductMultipleCategorySelect<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "اختر الفئات",
  initialValues = [],
  excludedCategoryIds = [],
  disabled,
  emptyLabel = "بدون",
  subrowKeys,
}: ProductMultipleCategorySelectProps<T>) {
  const fieldId = String(name)
  const [open, setOpen] = useState(false)
  const initialSelectedIds = useMemo(
    () => normalizeSelectedValues(initialValues),
    [initialValues]
  )

  const hasInitialValues = initialSelectedIds.length > 0

  const { data: categories, isPending: isPendingCategories } = useQuery({
    queryKey: productCategoryKeys.all,
    queryFn: listProductCategories,
    enabled: !hasInitialValues,
  })

  const { data: initialCategory, isPending: isPendingInitialCategory } =
    useQuery({
      queryKey: productCategoryKeys.detail(initialSelectedIds[0] ?? ""),
      queryFn: () => getProductCategory(initialSelectedIds[0] ?? ""),
      enabled: hasInitialValues && initialSelectedIds.length === 1,
    })

  const isPending = hasInitialValues
    ? isPendingInitialCategory
    : isPendingCategories

  const excludedIds = useMemo(
    () =>
      new Set(excludedCategoryIds.filter((id): id is string => Boolean(id))),
    [excludedCategoryIds]
  )

  const availableCategories = useMemo(() => {
    if (!hasInitialValues) {
      return filterCategoryTree(categories ?? [], excludedIds, subrowKeys)
    }

    const fallback = initialCategory ? [initialCategory as CategoryNode] : []
    return filterCategoryTree(
      fallback as never,
      excludedIds,
      subrowKeys
    ) as unknown as CategoryNode[]
  }, [categories, excludedIds, hasInitialValues, initialCategory, subrowKeys])

  const flatCategories = useMemo(
    () =>
      flattenCategoryTree(availableCategories as CategoryNode[], subrowKeys),
    [availableCategories, subrowKeys]
  )

  const categoryNamesById = useMemo(
    () => buildCategoryNameMap(availableCategories as never, subrowKeys),
    [availableCategories, subrowKeys]
  )

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selectedValues = normalizeSelectedValues(field.value)
        const selectedLabels = selectedValues
          .map((value) => categoryNamesById.get(value))
          .filter((label): label is string => Boolean(label))

        return (
          <UiField data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={fieldId}
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  disabled={disabled || isPending}
                  className="h-11 w-full justify-between"
                >
                  <span className="truncate text-start">
                    {selectedLabels.length
                      ? selectedLabels.join(", ")
                      : placeholder}
                  </span>
                  <ChevronDown data-icon="inline-end" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="ابحث عن فئة..." />
                  <CommandList>
                    <CommandEmpty>{emptyLabel}</CommandEmpty>
                    {isPending ? (
                      <CommandGroup>
                        <CommandItem disabled>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          جاري تحميل الفئات...
                        </CommandItem>
                      </CommandGroup>
                    ) : (
                      <CommandGroup>
                        {flatCategories.length ? (
                          flatCategories.map(({ category, depth }) => {
                            const categoryId = category.id ?? ""
                            const checked = selectedValues.includes(categoryId)

                            return (
                              <CommandItem
                                key={categoryId}
                                value={`${category.nameAr} ${categoryId}`}
                                className="flex items-center gap-2"
                                onSelect={() => {
                                  const nextValues = checked
                                    ? selectedValues.filter(
                                        (value) => value !== categoryId
                                      )
                                    : [...selectedValues, categoryId]

                                  field.onChange(nextValues)
                                }}
                              >
                                <Checkbox
                                  checked={checked}
                                  aria-hidden
                                  tabIndex={-1}
                                />
                                <span
                                  style={{ paddingInlineStart: depth * 16 }}
                                >
                                  {category.nameAr}
                                </span>
                                {depth > 0 ? (
                                  <span className="ms-auto text-xs text-muted-foreground">
                                    {subrowKeys ?? "children"}
                                  </span>
                                ) : null}
                              </CommandItem>
                            )
                          })
                        ) : (
                          <CommandItem disabled>لا توجد فئات متاحة</CommandItem>
                        )}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FieldDescription>يمكنك اختيار أكثر من فئة</FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </UiField>
        )
      }}
    />
  )
}
