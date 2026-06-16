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
import type { TagRef } from "@/modules/product/product/types"

import { listProductTags, productTagKeys } from "../actions"
import { ProductTag } from "../types"

type Props<T extends FieldValues> = {
  name: FieldPath<T>
  control: Control<T>
  label: React.ReactNode
  placeholder?: string
  disabled?: boolean
}

const tokenOfRef = (ref: TagRef): string =>
  tokenOfIdOrNewSlug(ref.id, slugify(ref.name ?? ""))

const normalizeValue = (value: unknown): TagRef[] =>
  Array.isArray(value)
    ? value.filter(
        (ref): ref is TagRef =>
          !!ref &&
          typeof ref === "object" &&
          (typeof ref.id === "string" || typeof ref.name === "string")
      )
    : []

function TagCreateForm({
  formRef,
  disabled,
  isDuplicate,
  canSave,
  onSave,
  onDraftSlugChange,
  registerBuildRef,
}: CreatableSelectCreateFormProps<TagRef>) {
  const [draft, setDraft] = useState("")

  useEffect(() => {
    registerBuildRef(() => {
      const trimmed = draft.trim()
      return trimmed ? { name: trimmed } : null
    })
  }, [draft, registerBuildRef])

  useEffect(() => {
    const trimmed = draft.trim()
    onDraftSlugChange(trimmed ? slugify(trimmed) : "")
  }, [draft, onDraftSlugChange])

  return (
    <div
      ref={formRef}
      className="mt-2 flex flex-col gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 p-2 sm:flex-row sm:items-start"
    >
      <div className="flex-1">
        <Input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              onSave()
            }
            if (event.key === "Escape") {
              event.preventDefault()
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
      <Button type="button" onClick={onSave} disabled={!canSave}>
        حفظ
      </Button>
    </div>
  )
}

function TagCreatableSelectView({
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
}: {
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
}) {
  const apiItems = useMemo(
    () =>
      tags
        .filter((tag) => !!tag.id)
        .map((tag) => ({ value: tag.id as string, label: tag.tagName })),
    [tags]
  )

  const apiSlugs = useMemo(
    () => tags.map((tag) => slugify(tag.tagName)),
    [tags]
  )

  return (
    <CreatableMultiSelect<TagRef>
      fieldId={fieldId}
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      invalid={invalid}
      error={error}
      refs={refs}
      onChange={onChange}
      isPending={isPending}
      apiItems={apiItems}
      apiSlugs={apiSlugs}
      emptyMessage="لا توجد وسوم"
      createOpenLabel="إضافة وسم جديد"
      createCloseLabel="إغلاق إضافة وسم"
      tokenOfRef={tokenOfRef}
      refFromId={(id) => ({ id })}
      refFromNewLabel={(name) => ({ name })}
      isNewRef={(ref) => !ref.id}
      getChipLabel={(ref, labelByValue) =>
        ref.id ? (labelByValue.get(ref.id) ?? "—") : (ref.name ?? "")
      }
      getRefSlug={(ref, labelByValue) => {
        if (ref.id) {
          const apiLabel = labelByValue.get(ref.id) ?? ""
          return apiLabel ? slugify(apiLabel) : slugify(ref.id)
        }
        return slugify(ref.name ?? "")
      }}
      getNewRefOptions={(selectedRefs) =>
        selectedRefs
          .filter((ref) => !ref.id && ref.name)
          .map((ref) => ({
            value: tokenOfRef(ref),
            label: ref.name as string,
          }))
      }
      CreateForm={TagCreateForm}
    />
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
      render={({ field, fieldState }) => (
        <TagCreatableSelectView
          fieldId={fieldId}
          label={label}
          placeholder={placeholder}
          disabled={disabled}
          invalid={fieldState.invalid}
          error={fieldState.error}
          refs={normalizeValue(field.value)}
          onChange={field.onChange}
          tags={tags ?? []}
          isPending={isPending}
        />
      )}
    />
  )
}
