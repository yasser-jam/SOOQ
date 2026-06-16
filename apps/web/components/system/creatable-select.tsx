"use client"

import * as React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Loader2, Minus, Plus } from "lucide-react"

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

/** Prefix for combobox tokens that represent unsaved inline entities. */
export const NEW_TOKEN_PREFIX = "__new__:"

const NEW_CHIP_CLASS =
  "border border-dashed border-primary/60 bg-primary/10 text-primary"

/** Normalizes a display name into a stable slug for dedup and token keys. */
export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-")
}

/** Builds a combobox token for a new (not-yet-saved) inline entity. */
export function newEntityToken(nameSlug: string): string {
  return `${NEW_TOKEN_PREFIX}${nameSlug}`
}

/** Maps an inline ref to a combobox string token (`id` or `__new__:<slug>`). */
export function tokenOfIdOrNewSlug(
  id: string | undefined,
  nameSlug: string
): string {
  return id ? id : newEntityToken(nameSlug)
}

/**
 * Converts combobox tokens back into inline refs.
 * Prefers the existing ref object so original casing/spacing is preserved.
 * Falls back to `labelByValue` (human-readable label) before the raw slug.
 */
export function tokensToRefs<TRef>({
  nextTokens,
  refs,
  labelByValue,
  tokenOfRef,
  refFromId,
  refFromNewLabel,
}: {
  nextTokens: string[]
  refs: TRef[]
  labelByValue: Map<string, string>
  tokenOfRef: (ref: TRef) => string
  refFromId: (id: string) => TRef
  refFromNewLabel: (label: string) => TRef
}): TRef[] {
  return nextTokens.map((token) => {
    if (token.startsWith(NEW_TOKEN_PREFIX)) {
      const existing = refs.find((ref) => tokenOfRef(ref) === token)
      if (existing) return existing

      const label =
        labelByValue.get(token) ?? token.slice(NEW_TOKEN_PREFIX.length)
      return refFromNewLabel(label)
    }

    return refFromId(token)
  })
}

export type CreatableSelectOption = {
  value: string
  label: string
  depth?: number
}

export type CreatableSelectCreateFormProps<TRef = unknown> = {
  formRef: React.RefObject<HTMLDivElement | null>
  disabled?: boolean
  isDuplicate: boolean
  canSave: boolean
  onSave: () => void
  /** Notify parent whenever the draft slug changes (for duplicate detection). */
  onDraftSlugChange: (slug: string) => void
  /** Registers a builder the parent calls on Save to produce the inline ref. */
  registerBuildRef: (buildRef: () => TRef | null) => void
}

export type CreatableMultiSelectProps<TRef> = {
  fieldId: string
  label: React.ReactNode
  description?: React.ReactNode
  placeholder: string
  disabled?: boolean
  invalid: boolean
  error?: { message?: string }
  refs: TRef[]
  onChange: (next: TRef[]) => void
  isPending: boolean
  apiItems: CreatableSelectOption[]
  /** Slugs derived from the API list — used to block duplicate inline creates. */
  apiSlugs: string[]
  emptyMessage: string
  createOpenLabel: string
  createCloseLabel: string
  tokenOfRef: (ref: TRef) => string
  refFromId: (id: string) => TRef
  refFromNewLabel: (label: string) => TRef
  isNewRef: (ref: TRef) => boolean
  getChipLabel: (ref: TRef, labelByValue: Map<string, string>) => string
  getRefSlug: (ref: TRef, labelByValue: Map<string, string>) => string
  getNewRefOptions: (refs: TRef[]) => CreatableSelectOption[]
  CreateForm: React.ComponentType<CreatableSelectCreateFormProps<TRef>>
  renderListItem?: (item: CreatableSelectOption) => React.ReactNode
}

function useDismissCreatePanel({
  creating,
  formRef,
  toggleRef,
  onDismiss,
}: {
  creating: boolean
  formRef: React.RefObject<HTMLDivElement | null>
  toggleRef: React.RefObject<HTMLButtonElement | null>
  onDismiss: () => void
}) {
  useEffect(() => {
    if (!creating) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (formRef.current?.contains(target)) return
      if (toggleRef.current?.contains(target)) return
      onDismiss()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss()
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [creating, formRef, toggleRef, onDismiss])
}

/**
 * Multi-select combobox for inline `{ id }` / `{ name… }` refs.
 *
 * - Existing entities are picked from the dropdown.
 * - New entities are drafted via the adjacent `+` panel (not typed into the combobox).
 * - Unsaved selections render as dashed chips.
 */
export function CreatableMultiSelect<TRef>({
  fieldId,
  label,
  description,
  placeholder,
  disabled,
  invalid,
  error,
  refs,
  onChange,
  isPending,
  apiItems,
  apiSlugs,
  emptyMessage,
  createOpenLabel,
  createCloseLabel,
  tokenOfRef,
  refFromId,
  refFromNewLabel,
  isNewRef,
  getChipLabel,
  getRefSlug,
  getNewRefOptions,
  CreateForm,
  renderListItem,
}: CreatableMultiSelectProps<TRef>) {
  const anchor = useComboboxAnchor()
  const [creating, setCreating] = useState(false)
  const [draftSlug, setDraftSlug] = useState("")
  const [createFormKey, setCreateFormKey] = useState(0)
  const formRef = useRef<HTMLDivElement | null>(null)
  const toggleRef = useRef<HTMLButtonElement | null>(null)
  const buildRefRef = useRef<(() => TRef | null) | null>(null)

  const registerBuildRef = useCallback((buildRef: () => TRef | null) => {
    buildRefRef.current = buildRef
  }, [])

  const items = useMemo(() => {
    return [...apiItems, ...getNewRefOptions(refs)]
  }, [apiItems, getNewRefOptions, refs])

  const labelByValue = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of items) map.set(item.value, item.label)
    return map
  }, [items])

  const comboboxValue = useMemo(() => refs.map(tokenOfRef), [refs, tokenOfRef])

  const existingSlugs = useMemo(() => {
    const set = new Set(apiSlugs)
    for (const ref of refs) set.add(getRefSlug(ref, labelByValue))
    return set
  }, [apiSlugs, refs, getRefSlug, labelByValue])

  const isDuplicate = !!draftSlug && existingSlugs.has(draftSlug)
  const canSave = !!draftSlug && !isDuplicate && !disabled

  const closeCreatePanel = useCallback(() => {
    setCreating(false)
    setDraftSlug("")
    setCreateFormKey((key) => key + 1)
  }, [])

  useDismissCreatePanel({
    creating,
    formRef,
    toggleRef,
    onDismiss: closeCreatePanel,
  })

  const handleComboboxChange = (nextTokens: string[]) => {
    onChange(
      tokensToRefs({
        nextTokens,
        refs,
        labelByValue,
        tokenOfRef,
        refFromId,
        refFromNewLabel,
      })
    )
  }

  const commit = () => {
    if (!canSave) return
    const nextRef = buildRefRef.current?.()
    if (!nextRef) return
    onChange([...refs, nextRef])
    closeCreatePanel()
  }

  const toggleCreating = () => {
    if (creating) {
      closeCreatePanel()
      return
    }
    setCreating(true)
    setDraftSlug("")
    setCreateFormKey((key) => key + 1)
  }

  const defaultRenderListItem = (item: CreatableSelectOption) => item.label

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
                    return (
                      <ComboboxChip
                        key={token}
                        className={isNewRef(ref) ? NEW_CHIP_CLASS : undefined}
                      >
                        {getChipLabel(ref, labelByValue)}
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
              <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
              <ComboboxList>
                {apiItems.map((item) => (
                  <ComboboxItem key={item.value} value={item.value}>
                    {renderListItem
                      ? renderListItem(item)
                      : defaultRenderListItem(item)}
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
          aria-label={creating ? createCloseLabel : createOpenLabel}
        >
          {creating ? <Minus /> : <Plus />}
        </Button>
      </div>

      {creating && (
        <CreateForm
          key={createFormKey}
          formRef={formRef}
          disabled={disabled}
          isDuplicate={isDuplicate}
          canSave={canSave}
          onSave={commit}
          onDraftSlugChange={setDraftSlug}
          registerBuildRef={registerBuildRef}
        />
      )}

      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError errors={[error]} />
    </UiField>
  )
}
