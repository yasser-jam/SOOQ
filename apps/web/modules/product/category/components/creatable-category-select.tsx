"use client"

import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"

import { useQuery } from "@tanstack/react-query"
import { Loader2, Minus, Plus } from "lucide-react"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Button } from "@workspace/ui/components/button"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@workspace/ui/components/combobox"
import {
  Field as UiField,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

import { listProductCategories, productCategoryKeys } from "../actions"
import { ProductCategory } from "../types"
import type { CategoryRef } from "@/modules/product/product/types"

type Props<T extends FieldValues> = {
  name: FieldPath<T>
  control: Control<T>
  label: React.ReactNode
  placeholder?: string
  disabled?: boolean
}

const slugify = (s: string): string =>
  s.trim().toLowerCase().replace(/\s+/g, "-")

const NEW_TOKEN_PREFIX = "__new__:"

const tokenOfRef = (ref: CategoryRef): string =>
  ref.id ? ref.id : `${NEW_TOKEN_PREFIX}${slugify(ref.nameAr ?? "")}`

const normalizeValue = (v: unknown): CategoryRef[] =>
  Array.isArray(v)
    ? v.filter(
        (r): r is CategoryRef =>
          !!r &&
          typeof r === "object" &&
          (typeof (r as CategoryRef).id === "string" ||
            typeof (r as CategoryRef).nameAr === "string")
      )
    : []

const NEW_CHIP_CLASS =
  "border border-dashed border-primary/60 bg-primary/10 text-primary"

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
    const children = getCategoryChildren(category)
    const current: FlattenedCategory | null = id
      ? { id, nameAr: category.nameAr, depth }
      : null
    return [
      ...(current ? [current] : []),
      ...flattenCategoryTree(children, depth + 1),
    ]
  })

type CreatableCategorySelectViewProps = {
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
}

function CreatableCategorySelectView({
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
}: CreatableCategorySelectViewProps) {
  const anchor = useComboboxAnchor()
  const [creating, setCreating] = useState(false)
  const [draftAr, setDraftAr] = useState("")
  const [draftEn, setDraftEn] = useState("")
  const formRef = useRef<HTMLDivElement | null>(null)
  const toggleRef = useRef<HTMLButtonElement | null>(null)

  const flatCategories = useMemo(
    () => flattenCategoryTree(categories ?? []),
    [categories]
  )

  const apiItems = useMemo(
    () =>
      flatCategories.map((c) => ({
        value: c.id,
        label: c.nameAr,
        depth: c.depth,
      })),
    [flatCategories]
  )

  const items = useMemo(() => {
    const newItems = refs
      .filter((r) => !r.id && r.nameAr)
      .map((r) => ({
        value: tokenOfRef(r),
        label: r.nameAr as string,
        depth: 0,
      }))
    return [...apiItems, ...newItems]
  }, [apiItems, refs])

  const labelByValue = useMemo(() => {
    const m = new Map<string, string>()
    for (const it of items) m.set(it.value, it.label)
    return m
  }, [items])

  const comboboxValue = useMemo(() => refs.map(tokenOfRef), [refs])

  const handleComboboxChange = (nextTokens: string[]) => {
    const next: CategoryRef[] = nextTokens.map((token) => {
      if (token.startsWith(NEW_TOKEN_PREFIX)) {
        const existing = refs.find((r) => tokenOfRef(r) === token)
        if (existing) return existing
        return { nameAr: token.slice(NEW_TOKEN_PREFIX.length) }
      }
      return { id: token }
    })
    onChange(next)
  }

  useEffect(() => {
    if (!creating) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (formRef.current?.contains(target)) return
      if (toggleRef.current?.contains(target)) return
      setCreating(false)
      setDraftAr("")
      setDraftEn("")
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [creating])

  const trimmedAr = draftAr.trim()
  const trimmedEn = draftEn.trim()
  const draftSlug = trimmedAr ? slugify(trimmedAr) : ""

  const existingSlugs = useMemo(() => {
    const set = new Set<string>()
    for (const c of flatCategories) set.add(slugify(c.nameAr))
    for (const r of refs) {
      if (r.id) {
        const apiLabel = labelByValue.get(r.id) ?? ""
        if (apiLabel) set.add(slugify(apiLabel))
      } else if (r.nameAr) {
        set.add(slugify(r.nameAr))
      }
    }
    return set
  }, [flatCategories, refs, labelByValue])

  const isDuplicate = !!trimmedAr && existingSlugs.has(draftSlug)
  const canSave = !!trimmedAr && !isDuplicate && !disabled

  const commit = () => {
    if (!canSave) return
    const next: CategoryRef = trimmedEn
      ? { nameAr: trimmedAr, nameEn: trimmedEn }
      : { nameAr: trimmedAr }
    onChange([...refs, next])
    setCreating(false)
    setDraftAr("")
    setDraftEn("")
  }

  const toggleCreating = () => {
    setCreating((c) => !c)
    setDraftAr("")
    setDraftEn("")
  }

  return (
    <UiField data-invalid={invalid}>
      <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
      <div className="flex items-stretch gap-2">
        <div className="flex-1">
          <Combobox
            multiple
            autoHighlight
            items={items}
            value={comboboxValue}
            onValueChange={handleComboboxChange}
            disabled={disabled || isPending}
          >
            <ComboboxChips ref={anchor} className="relative w-full">
              <ComboboxValue placeholder={placeholder}>
                <React.Fragment>
                  {refs.map((ref) => {
                    const token = tokenOfRef(ref)
                    const isNew = !ref.id
                    const labelText = ref.id
                      ? (labelByValue.get(ref.id) ?? "—")
                      : (ref.nameAr ?? "")
                    return (
                      <ComboboxChip
                        key={token}
                        className={isNew ? NEW_CHIP_CLASS : undefined}
                      >
                        {labelText}
                      </ComboboxChip>
                    )
                  })}
                  <ComboboxChipsInput id={fieldId} placeholder={placeholder} />
                </React.Fragment>
              </ComboboxValue>
              {isPending && (
                <Loader2 className="absolute end-2 top-3 size-4 animate-spin text-muted-foreground" />
              )}
            </ComboboxChips>
            <ComboboxContent anchor={anchor}>
              <ComboboxEmpty>لا توجد فئات</ComboboxEmpty>
              <ComboboxList>
                {apiItems.map((item) => (
                  <ComboboxItem key={item.value} value={item.value}>
                    <span style={{ paddingInlineStart: item.depth * 12 }}>
                      {item.label}
                    </span>
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
        <Button
          ref={toggleRef}
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0"
          onClick={toggleCreating}
          disabled={disabled}
          aria-pressed={creating}
          aria-label={creating ? "إغلاق إضافة فئة" : "إضافة فئة جديدة"}
        >
          {creating ? <Minus /> : <Plus />}
        </Button>
      </div>

      {creating && (
        <div
          ref={formRef}
          className="mt-2 flex flex-col gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 p-2 sm:flex-row sm:items-start"
        >
          <div className="flex-1">
            <Input
              autoFocus
              value={draftAr}
              onChange={(e) => setDraftAr(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commit()
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
              onChange={(e) => setDraftEn(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commit()
                }
              }}
              placeholder="بالإنجليزية - اختياري"
              disabled={disabled}
            />
          </div>
          <Button type="button" onClick={commit} disabled={!canSave}>
            حفظ
          </Button>
        </div>
      )}

      <FieldDescription>يمكنك اختيار أكثر من فئة</FieldDescription>
      <FieldError errors={[error]} />
    </UiField>
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
      render={({ field, fieldState }) => {
        const refs = normalizeValue(field.value)
        return (
          <CreatableCategorySelectView
            fieldId={fieldId}
            label={label}
            placeholder={placeholder}
            disabled={disabled}
            invalid={fieldState.invalid}
            error={fieldState.error}
            refs={refs}
            onChange={field.onChange}
            categories={categories ?? []}
            isPending={isPending}
          />
        )
      }}
    />
  )
}
