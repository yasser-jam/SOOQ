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

import { listProductCategories, productCategoryKeys } from "../actions"
import { ProductCategory } from "../types"

type ProductMultipleCategorySelectProps<T extends FieldValues> = {
  name: FieldPath<T>
  control: Control<T>
  label: string
  placeholder?: string
  disabled?: boolean
}

const normalizeSelectedValues = (values: unknown): string[] => {
  if (!Array.isArray(values)) return []

  return values.filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0
  )
}

type FlattenedCategory = {
  id: string
  nameAr: string
  depth: number
}

const getCategoryId = (category: ProductCategory): string => {
  // The API normalizes `id` on the top-level items in [actions.ts](apps/web/modules/product/category/actions.ts),
  // but nested `children` may still only have `categoryId`.
  return (category.id ?? category.categoryId ?? "").trim()
}

const getCategoryChildren = (category: ProductCategory): ProductCategory[] => {
  const children = category.children
  return Array.isArray(children) ? (children as ProductCategory[]) : []
}

const flattenCategoryTree = (
  categories: ProductCategory[],
  depth = 0
): FlattenedCategory[] => {
  return (categories ?? []).flatMap((category) => {
    const id = getCategoryId(category)
    const nameAr = category.nameAr
    const children = getCategoryChildren(category)

    const current: FlattenedCategory | null = id
      ? { id, nameAr, depth }
      : null

    return [
      ...(current ? [current] : []),
      ...flattenCategoryTree(children, depth + 1),
    ]
  })
}

export default function ProductMultipleCategorySelect<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "اختر الفئات",
  disabled,
}: ProductMultipleCategorySelectProps<T>) {
  const fieldId = String(name)
  const [open, setOpen] = useState(false)

  const { data: categories, isPending } = useQuery({
    queryKey: productCategoryKeys.all,
    queryFn: listProductCategories,
  })

  const flatCategories = useMemo(() => {
    // API response is hierarchical (each category can contain nested `children`).
    // We flatten it so the list renders as a single level while preserving `depth` for indentation.
    return flattenCategoryTree(categories ?? [])
  }, [categories])

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={[] as any}
      render={({ field, fieldState }) => {
        const selectedIds = normalizeSelectedValues(field.value)

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
                  aria-invalid={fieldState.invalid || undefined}
                  disabled={disabled || isPending}
                  className="h-12 w-full justify-between rounded-md border-input bg-white px-2.5 py-1 text-lg md:text-sm dark:bg-input/30"
                >
                  <span
                    className={
                      selectedIds.length > 0
                        ? "truncate text-start"
                        : "truncate text-start text-muted-foreground"
                    }
                  >
                    {selectedIds.length > 0
                      ? `${selectedIds.length} فئات مختارة`
                      : placeholder}
                  </span>
                  <ChevronDown data-icon="inline-end" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] rounded-xl p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="ابحث عن فئة..." />
                  <CommandList>
                    <CommandEmpty>لا يوجد</CommandEmpty>
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
                          flatCategories.map((category) => {
                            const checked = selectedIds.includes(category.id)

                            return (
                              <CommandItem
                                key={category.id}
                                value={`${category.nameAr} ${category.id}`}
                                className="flex items-center gap-2"
                                onSelect={() => {
                                  const nextValues = checked
                                    ? selectedIds.filter(
                                        (value) => value !== category.id
                                      )
                                    : [...selectedIds, category.id]

                                  field.onChange(nextValues)
                                }}
                              >
                                <Checkbox
                                  checked={checked}
                                  aria-hidden
                                  tabIndex={-1}
                                />
                                <span
                                  style={{ paddingInlineStart: category.depth * 16 }}
                                >
                                  {category.nameAr}
                                </span>
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
