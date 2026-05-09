"use client"

import { useCallback, useEffect, useRef } from "react"
import type { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"

const DRAFT_KEY_PREFIX = "product-draft:"
const DEFAULT_INTERVAL_MS = 30_000 // NFR-UX-006

const draftKey = (productIdOrNew: string) =>
  `${DRAFT_KEY_PREFIX}${productIdOrNew || "new"}`

/**
 * isFile / replacer / reviver — File objects can't be JSON-serialized.
 * We strip them entirely; on restore the user's previous file picker state
 * is lost, but their text fields, options, and IDs are kept.
 */
const isFileLike = (v: unknown): v is File =>
  typeof File !== "undefined" && v instanceof File

const replacer = (_key: string, value: unknown) => {
  if (isFileLike(value)) return undefined
  if (Array.isArray(value)) return value.filter((v) => !isFileLike(v))
  return value
}

export type UseProductDraftOptions = {
  /** Use 'new' for create mode, the productId for edit mode. */
  productId: string | null
  /** react-hook-form instance (any field shape). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any, unknown, any>
  /** Save interval in ms. Defaults to 30000 (NFR-UX-006). */
  intervalMs?: number
  /** Skip mounting (e.g. while initial product data is still loading). */
  enabled?: boolean
}

/**
 * Auto-saves the product editor form to localStorage every `intervalMs`.
 * On mount, surfaces a Sonner toast offering to restore an existing draft.
 *
 * Returns helpers to manually clear the draft (e.g. after successful save).
 */
export function useProductDraft({
  productId,
  form,
  intervalMs = DEFAULT_INTERVAL_MS,
  enabled = true,
}: UseProductDraftOptions) {
  const restoredRef = useRef(false)

  const clear = useCallback(() => {
    if (typeof window === "undefined" || !productId) return
    window.localStorage.removeItem(draftKey(productId))
  }, [productId])

  // Periodic save
  useEffect(() => {
    if (!enabled || !productId) return
    if (typeof window === "undefined") return

    const id = window.setInterval(() => {
      try {
        const values = form.getValues()
        const json = JSON.stringify(values, replacer)
        window.localStorage.setItem(draftKey(productId), json)
      } catch {
        // localStorage quota / serialization errors — silently skip; next tick will retry
      }
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [enabled, productId, form, intervalMs])

  // Restore prompt on mount (once per editor instance)
  useEffect(() => {
    if (!enabled || !productId || restoredRef.current) return
    if (typeof window === "undefined") return

    const raw = window.localStorage.getItem(draftKey(productId))
    if (!raw) return
    restoredRef.current = true

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      window.localStorage.removeItem(draftKey(productId))
      return
    }

    toast("توجد مسوّدة محفوظة لهذا المنتج", {
      description: "هل تريد استعادتها؟",
      action: {
        label: "استعادة",
        onClick: () => {
          // Replace current form values with the draft
          form.reset(parsed as never)
        },
      },
      cancel: {
        label: "تجاهل",
        onClick: () => {
          window.localStorage.removeItem(draftKey(productId))
        },
      },
      duration: 15_000,
    })
  }, [enabled, productId, form])

  return { clear, draftKey: productId ? draftKey(productId) : null }
}
