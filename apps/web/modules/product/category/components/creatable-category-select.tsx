"use client"

import { useEffect, useMemo, useState } from "react"

import { useQuery } from "@tanstack/react-query"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import {
  CreatableMultiSelect,
  type CreatableSelectCreateFormProps,
  slugify,
  tokenOfIdOrNewSlug,
} from "@/components/system/creatable-select"
import type { CategoryRef } from "@/modules/product/product/types"

import { listProductCategories, productCategoryKeys } from "../actions"
import { ProductCategory } from "../types"

type Props<T extends FieldValues> = {
  name: FieldPath<T>
  control: Control<T>
  label: React.ReactNode
  placeholder?: string
  disabled?: boolean
}

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

/** Flattens the nested category tree into selectable rows with depth for indentation. */
const flattenCategoryTree = (
  categories: ProductCategory[],
  depth = 0
): FlattenedCategory[] =>
  (categories ?? []).flatMap((category) => {
    const id = getCategoryId(category)
    const children = getCategoryChildren(category)
    const current: FlattenedCategory | null = id
      ? { id, nameAr: category.nameAr, depth }
      : null
    return [
      ...(current ? [current] : []),
      ...flattenCategoryTree(children, depth + 1),
    ]
  })

const tokenOfRef = (ref: CategoryRef): string =>
  tokenOfIdOrNewSlug(ref.id, slugify(ref.nameAr ?? ""))

const normalizeValue = (value: unknown): CategoryRef[] =>
  Array.isArray(value)
    ? value.filter(
        (ref): ref is CategoryRef =>
          !!ref &&
          typeof ref === "object" &&
          (typeof ref.id === "string" || typeof ref.nameAr === "string")
      )
    : []

function CategoryCreateForm({
  formRef,
  disabled,
  isDuplicate,
  canSave,
  onSave,
  onDraftSlugChange,
  registerBuildRef,
}: CreatableSelectCreateFormProps<CategoryRef>) {
  const [draftAr, setDraftAr] = useState("")
  const [draftEn, setDraftEn] = useState("")

  useEffect(() => {
    registerBuildRef(() => {
      const trimmedAr = draftAr.trim()
      if (!trimmedAr) return null

      const trimmedEn = draftEn.trim()
      return trimmedEn
        ? { nameAr: trimmedAr, nameEn: trimmedEn }
        : { nameAr: trimmedAr }
    })
  }, [draftAr, draftEn, registerBuildRef])

  useEffect(() => {
    const trimmedAr = draftAr.trim()
    onDraftSlugChange(trimmedAr ? slugify(trimmedAr) : "")
  }, [draftAr, onDraftSlugChange])

  return (
    <div
      ref={formRef}
      className="mt-2 flex flex-col gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 p-2 sm:flex-row sm:items-start"
    >
      <div className="flex-1">
        <Input
          autoFocus
          value={draftAr}
          onChange={(event) => setDraftAr(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              onSave()
            }
          }}
          placeholder="الاسم بالعربية *"
          disabled={disabled}
          aria-invalid={isDuplicate || undefined}
        />
        {isDuplicate && (
          <p className="mt-1 text-xs text-destructive">موجودة بالفعل</p>
        )}
      </div>
      <div className="flex-1">
        <Input
          value={draftEn}
          onChange={(event) => setDraftEn(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              onSave()
            }
          }}
          placeholder="بالإنجليزية - اختياري"
          disabled={disabled}
        />
      </div>
      <Button type="button" onClick={onSave} disabled={!canSave}>
        حفظ
      </Button>
    </div>
  )
}

function CategoryCreatableSelectView({
  fieldId,
  label,
  placeholder,
  disabled,
  invalid,
  error,
  refs,
  onChange,
  categories,
  isPending,
}: {
  fieldId: string
  label: React.ReactNode
  placeholder: string
  disabled: boolean | undefined
  invalid: boolean
  error: { message?: string } | undefined
  refs: CategoryRef[]
  onChange: (next: CategoryRef[]) => void
  categories: ProductCategory[]
  isPending: boolean
}) {
  const flatCategories = useMemo(
    () => flattenCategoryTree(categories ?? []),
    [categories]
  )

  const apiItems = useMemo(
    () =>
      flatCategories.map((category) => ({
        value: category.id,
        label: category.nameAr,
        depth: category.depth,
      })),
    [flatCategories]
  )

  const apiSlugs = useMemo(
    () => flatCategories.map((category) => slugify(category.nameAr)),
    [flatCategories]
  )

  return (
    <CreatableMultiSelect<CategoryRef>
      fieldId={fieldId}
      label={label}
      description="يمكنك اختيار أكثر من فئة"
      placeholder={placeholder}
      disabled={disabled}
      invalid={invalid}
      error={error}
      refs={refs}
      onChange={onChange}
      isPending={isPending}
      apiItems={apiItems}
      apiSlugs={apiSlugs}
      emptyMessage="لا توجد فئات"
      createOpenLabel="إضافة فئة جديدة"
      createCloseLabel="إغلاق إضافة فئة"
      tokenOfRef={tokenOfRef}
      refFromId={(id) => ({ id })}
      refFromNewLabel={(nameAr) => ({ nameAr })}
      isNewRef={(ref) => !ref.id}
      getChipLabel={(ref, labelByValue) =>
        ref.id ? (labelByValue.get(ref.id) ?? "—") : (ref.nameAr ?? "")
      }
      getRefSlug={(ref, labelByValue) => {
        if (ref.id) {
          const apiLabel = labelByValue.get(ref.id) ?? ""
          return apiLabel ? slugify(apiLabel) : slugify(ref.id)
        }
        return slugify(ref.nameAr ?? "")
      }}
      getNewRefOptions={(selectedRefs) =>
        selectedRefs
          .filter((ref) => !ref.id && ref.nameAr)
          .map((ref) => ({
            value: tokenOfRef(ref),
            label: ref.nameAr as string,
            depth: 0,
          }))
      }
      CreateForm={CategoryCreateForm}
      renderListItem={(item) => (
        <span style={{ paddingInlineStart: (item.depth ?? 0) * 12 }}>
          {item.label}
        </span>
      )}
    />
  )
}

export default function CreatableCategorySelect<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "اختر الفئات",
  disabled,
}: Props<T>) {
  const fieldId = String(name)

  const { data: categories, isPending } = useQuery({
    queryKey: productCategoryKeys.all,
    queryFn: listProductCategories,
  })

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={[] as never}
      render={({ field, fieldState }) => (
        <CategoryCreatableSelectView
          fieldId={fieldId}
          label={label}
          placeholder={placeholder}
          disabled={disabled}
          invalid={fieldState.invalid}
          error={fieldState.error}
          refs={normalizeValue(field.value)}
          onChange={field.onChange}
          categories={categories ?? []}
          isPending={isPending}
        />
      )}
    />
  )
}
