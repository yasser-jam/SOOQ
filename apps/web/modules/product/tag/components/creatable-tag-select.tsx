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
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

import { listProductTags, productTagKeys } from "../actions"
import { ProductTag } from "../types"
import type { TagRef } from "@/modules/product/product/types"

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

const tokenOfRef = (ref: TagRef): string =>
  ref.id ? ref.id : `${NEW_TOKEN_PREFIX}${slugify(ref.name ?? "")}`

const normalizeValue = (v: unknown): TagRef[] =>
  Array.isArray(v)
    ? v.filter(
        (r): r is TagRef =>
          !!r &&
          typeof r === "object" &&
          (typeof (r as TagRef).id === "string" ||
            typeof (r as TagRef).name === "string")
      )
    : []

const NEW_CHIP_CLASS =
  "border border-dashed border-primary/60 bg-primary/10 text-primary"

type CreatableTagSelectViewProps = {
  fieldId: string
  label: React.ReactNode
  placeholder: string
  disabled: boolean | undefined
  invalid: boolean
  error: { message?: string } | undefined
  refs: TagRef[]
  onChange: (next: TagRef[]) => void
  tags: ProductTag[]
  isPending: boolean
}

function CreatableTagSelectView({
  fieldId,
  label,
  placeholder,
  disabled,
  invalid,
  error,
  refs,
  onChange,
  tags,
  isPending,
}: CreatableTagSelectViewProps) {
  const anchor = useComboboxAnchor()
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState("")
  const formRef = useRef<HTMLDivElement | null>(null)
  const toggleRef = useRef<HTMLButtonElement | null>(null)

  const apiItems = useMemo(
    () =>
      tags
        .filter((t) => !!t.id)
        .map((t) => ({ value: t.id as string, label: t.tagName })),
    [tags]
  )

  const items = useMemo(() => {
    const newItems = refs
      .filter((r) => !r.id && r.name)
      .map((r) => ({ value: tokenOfRef(r), label: r.name as string }))
    return [...apiItems, ...newItems]
  }, [apiItems, refs])

  const labelByValue = useMemo(() => {
    const m = new Map<string, string>()
    for (const it of items) m.set(it.value, it.label)
    return m
  }, [items])

  const comboboxValue = useMemo(() => refs.map(tokenOfRef), [refs])

  const handleComboboxChange = (nextTokens: string[]) => {
    const next: TagRef[] = nextTokens.map((token) => {
      if (token.startsWith(NEW_TOKEN_PREFIX)) {
        const existing = refs.find((r) => tokenOfRef(r) === token)
        if (existing) return existing
        return { name: token.slice(NEW_TOKEN_PREFIX.length) }
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
      setDraft("")
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [creating])

  const trimmed = draft.trim()
  const draftSlug = trimmed ? slugify(trimmed) : ""

  const existingSlugs = useMemo(() => {
    const set = new Set<string>()
    for (const t of tags) set.add(slugify(t.tagName))
    for (const r of refs) {
      if (r.id) {
        const apiLabel = labelByValue.get(r.id) ?? ""
        if (apiLabel) set.add(slugify(apiLabel))
      } else if (r.name) {
        set.add(slugify(r.name))
      }
    }
    return set
  }, [tags, refs, labelByValue])

  const isDuplicate = !!trimmed && existingSlugs.has(draftSlug)
  const canSave = !!trimmed && !isDuplicate && !disabled

  const commit = () => {
    if (!canSave) return
    onChange([...refs, { name: trimmed }])
    setCreating(false)
    setDraft("")
  }

  const toggleCreating = () => {
    setCreating((c) => !c)
    setDraft("")
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
                      : (ref.name ?? "")
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
              <ComboboxEmpty>لا توجد وسوم</ComboboxEmpty>
              <ComboboxList>
                {apiItems.map((item) => (
                  <ComboboxItem key={item.value} value={item.value}>
                    {item.label}
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
          aria-label={creating ? "إغلاق إضافة وسم" : "إضافة وسم جديد"}
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
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commit()
                }
              }}
              placeholder="اسم الوسم *"
              disabled={disabled}
              aria-invalid={isDuplicate || undefined}
            />
            {isDuplicate && (
              <p className="mt-1 text-xs text-destructive">موجودة بالفعل</p>
            )}
          </div>
          <Button type="button" onClick={commit} disabled={!canSave}>
            حفظ
          </Button>
        </div>
      )}

      <FieldError errors={[error]} />
    </UiField>
  )
}

export default function CreatableTagSelect<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "اختر الوسوم",
  disabled,
}: Props<T>) {
  const fieldId = String(name)

  const { data: tags, isPending } = useQuery<ProductTag[]>({
    queryKey: productTagKeys.all,
    queryFn: listProductTags,
  })

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={[] as never}
      render={({ field, fieldState }) => {
        const refs = normalizeValue(field.value)
        return (
          <CreatableTagSelectView
            fieldId={fieldId}
            label={label}
            placeholder={placeholder}
            disabled={disabled}
            invalid={fieldState.invalid}
            error={fieldState.error}
            refs={refs}
            onChange={field.onChange}
            tags={tags ?? []}
            isPending={isPending}
          />
        )
      }}
    />
  )
}
