"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { AlertTriangle, History, Package } from "lucide-react"

import InventoryAdjustModal from "@/modules/inventory/components/adjust-modal"
import VariantHistoryDrawer from "@/modules/inventory/components/variant-history-drawer"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import type { VariantRequest } from "@/modules/product/variant/types"

/**
 * Defensive view that accepts both:
 *  - the form schema shape (optionNameAr/optionNameEn, values[].valueAr/valueEn)
 *  - the normalized server shape (titleAr/titleEn) emitted historically by
 *    [[normalizeGetProduct]] for older product responses.
 */
type OptionValueView = {
  valueAr?: string
  valueEn?: string
  titleAr?: string
  titleEn?: string
  colorHex?: string | null
}

type OptionView = {
  optionNameAr?: string
  optionNameEn?: string
  titleAr?: string
  titleEn?: string
  values: OptionValueView[]
}

const optionAr = (opt: OptionView): string =>
  opt.optionNameAr ?? opt.titleAr ?? ""
const optionEn = (opt: OptionView): string =>
  opt.optionNameEn ?? opt.titleEn ?? ""
const valueAr = (v: OptionValueView): string => v.valueAr ?? v.titleAr ?? ""
const valueEn = (v: OptionValueView): string => v.valueEn ?? v.titleEn ?? ""

// SOOQ-Front convention (per Phase 2 plan): axis key = optionNameAr, value =
// valueAr; both fall back to the EN sibling when AR is empty so an AR-only
// store stays valid and an EN-only test fixture still works.
const axisKeyOf = (opt: OptionView): string =>
  (optionAr(opt) || optionEn(opt)).trim()
const valueLabelOf = (v: OptionValueView): string =>
  (valueAr(v) || valueEn(v)).trim()

type Props = {
  productId: string
}

const cartesian = <T,>(arrays: T[][]): T[][] => {
  if (arrays.length === 0) return []
  return arrays.reduce<T[][]>(
    (acc, current) => acc.flatMap((row) => current.map((item) => [...row, item])),
    [[]]
  )
}

// Stable signature for an attributes map so we can match form.variants to
// Cartesian rows without depending on insertion order.
const attributesSignature = (attributes: Record<string, string>): string =>
  Object.keys(attributes)
    .sort()
    .map((k) => `${k}=${attributes[k]}`)
    .join("|")

const blankVariant = (attributes: Record<string, string>): VariantRequest => ({
  attributes,
  isActive: true,
})

/**
 * Variant Matrix editor (PRD-002, PRD-018) — Phase 2 (PRD).
 *
 * Pure controlled view over the product form's `variants` field:
 *  - Reads option axes from `form.options` and renders the Cartesian product.
 *  - For each Cartesian row, finds (or creates) the matching entry in
 *    `form.variants` keyed by attributes, and binds inputs to it directly.
 *  - On axis/value changes, reconciles `form.variants` so it always matches
 *    the current Cartesian — orphaned entries are dropped (they would be
 *    soft-deleted by the backend on save anyway).
 *  - The orphan warning surfaces server-side variants from the original load
 *    that the user has edited away — informational, no action required.
 *
 * No mutations: the product form's main "حفظ" button is the only save.
 */
export default function VariantMatrix({ productId }: Props) {
  const form = useFormContext()

  const watchedOptions = useWatch({
    control: form.control,
    name: "options",
  }) as OptionView[] | undefined

  const watchedVariants = useWatch({
    control: form.control,
    name: "variants",
  }) as VariantRequest[] | undefined

  // Snapshot of the variants the server returned at hydration time. Used only
  // to compute the orphan warning ("X variants will be archived on save") —
  // never mutated after the first capture. We use state (not a ref) so the
  // orphan list re-renders when the snapshot first lands; once set, the
  // setter is a no-op because the effect early-returns.
  const [originalServerVariants, setOriginalServerVariants] = useState<
    VariantRequest[] | null
  >(null)
  useEffect(() => {
    if (originalServerVariants !== null) return
    if (!watchedVariants) return
    if (watchedVariants.length === 0) return
    const hasServerIds = watchedVariants.some((v) => v.variantId)
    if (!hasServerIds) return
    setOriginalServerVariants(
      watchedVariants.map((v) => ({
        ...v,
        attributes: { ...v.attributes },
      }))
    )
  }, [watchedVariants, originalServerVariants])

  // Dedupe option axes by name (case-insensitive). Backend has been observed
  // to leak duplicate axes from older saves; we collapse them here so the
  // matrix stays consistent until the user re-saves.
  const productOptions: OptionView[] = useMemo(() => {
    const list = watchedOptions ?? []
    const seen = new Set<string>()
    const out: OptionView[] = []
    for (const o of list) {
      const k = (optionEn(o) || optionAr(o)).trim().toLowerCase()
      if (!k || seen.has(k)) continue
      seen.add(k)
      out.push(o)
    }
    return out
  }, [watchedOptions])

  const formAxisDuplicateCount =
    (watchedOptions?.length ?? 0) - productOptions.length

  // Cartesian rows of (option-value)[] — one per matrix cell.
  const cartesianRows = useMemo(() => {
    if (productOptions.length === 0) return [] as OptionValueView[][]
    const valuesPerAxis = productOptions.map((opt) => opt.values ?? [])
    return cartesian(valuesPerAxis)
  }, [productOptions])

  // The attributes map for each Cartesian row, in axis order. This is the
  // canonical shape the backend expects (Phase 2: `{axisKey: valueLabel}`).
  const cartesianAttributes = useMemo(
    () =>
      cartesianRows.map((row) => {
        const attributes: Record<string, string> = {}
        row.forEach((value, axisIdx) => {
          const axis = axisKeyOf(productOptions[axisIdx]!)
          const label = valueLabelOf(value)
          if (axis && label) attributes[axis] = label
        })
        return attributes
      }),
    [cartesianRows, productOptions]
  )

  // Reconcile form.variants against the Cartesian whenever options change.
  // Keep entries whose attributes match a current row (preserve edits +
  // server-known variantId). Add empty entries for new combos. Drop orphans.
  useEffect(() => {
    const current = (watchedVariants ?? []) as VariantRequest[]
    const bySig = new Map<string, VariantRequest>()
    for (const v of current) {
      bySig.set(attributesSignature(v.attributes ?? {}), v)
    }

    const next: VariantRequest[] = cartesianAttributes.map((attributes) => {
      const sig = attributesSignature(attributes)
      const existing = bySig.get(sig)
      if (existing) {
        // Re-use the existing entry but normalize the attributes object so the
        // axis order matches the current options layout (avoids stale keys
        // sticking around if the user renamed an axis).
        return { ...existing, attributes }
      }
      return blankVariant(attributes)
    })

    // Skip the setValue if nothing actually changed — RHF would otherwise
    // mark the form dirty on every render when options change downstream.
    const isSame =
      current.length === next.length &&
      current.every((v, i) => {
        const target = next[i]
        return (
          target !== undefined &&
          attributesSignature(v.attributes ?? {}) ===
            attributesSignature(target.attributes ?? {}) &&
          v.sku === target.sku &&
          v.price === target.price &&
          v.stockQty === target.stockQty &&
          v.costPrice === target.costPrice &&
          v.barcode === target.barcode &&
          v.isActive === target.isActive &&
          v.variantId === target.variantId
        )
      })

    if (!isSame) {
      form.setValue("variants", next, {
        shouldDirty: current.length !== 0 || next.length !== 0,
        shouldValidate: false,
      })
    }
  }, [cartesianAttributes, watchedVariants, form])

  // Variants from the original server load whose attributes no longer match
  // any Cartesian row — they will be archived on save. Informational only.
  const orphanServerVariants = useMemo(() => {
    if (!originalServerVariants) return []
    const validSigs = new Set(cartesianAttributes.map(attributesSignature))
    return originalServerVariants.filter(
      (v) =>
        v.variantId && !validSigs.has(attributesSignature(v.attributes ?? {}))
    )
  }, [cartesianAttributes, originalServerVariants])

  // Local SKU duplicate detection across the current variants list. Backend
  // ERR_1003 fires on save if duplicates slip through; we surface inline.
  const duplicateSkus = useMemo(() => {
    const counts = new Map<string, number>()
    for (const v of watchedVariants ?? []) {
      const sku = (v.sku ?? "").trim()
      if (!sku) continue
      counts.set(sku, (counts.get(sku) ?? 0) + 1)
    }
    return new Set(
      Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([sku]) => sku)
    )
  }, [watchedVariants])

  // Lookup: signature → index in form.variants. Used by every cell input to
  // dispatch updates to the right entry.
  const variantIndexBySig = useMemo(() => {
    const map = new Map<string, number>()
    ;(watchedVariants ?? []).forEach((v, i) => {
      map.set(attributesSignature(v.attributes ?? {}), i)
    })
    return map
  }, [watchedVariants])

  const updateVariantField = useCallback(
    (sig: string, patch: Partial<VariantRequest>) => {
      const current = (form.getValues("variants") ?? []) as VariantRequest[]
      const idx = current.findIndex(
        (v) => attributesSignature(v.attributes ?? {}) === sig
      )
      if (idx < 0) return
      const next = [...current]
      next[idx] = { ...current[idx]!, ...patch }
      form.setValue("variants", next, {
        shouldDirty: true,
        shouldValidate: false,
      })
    },
    [form]
  )

  // Inventory adjust modal + history drawer state
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null)
  const [activeVariantSku, setActiveVariantSku] = useState<string>("")
  const [activeVariantStock, setActiveVariantStock] = useState<
    number | undefined
  >(undefined)

  const openAdjust = useCallback(
    (variantId: string, sku: string, stock: number | undefined) => {
      setActiveVariantId(variantId)
      setActiveVariantSku(sku)
      setActiveVariantStock(stock)
      setAdjustOpen(true)
    },
    []
  )

  const openHistory = useCallback((variantId: string, sku: string) => {
    setActiveVariantId(variantId)
    setActiveVariantSku(sku)
    setHistoryOpen(true)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>مصفوفة المتغيّرات</CardTitle>
        <CardDescription>
          {productOptions.length === 0
            ? "أضف خيارات (Size, Color...) من تبويب الخيارات لتوليد المصفوفة."
            : `الإجمالي: ${cartesianRows.length} متغيّر (${productOptions.length} محور). يُحفظ مع المنتج.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {formAxisDuplicateCount > 0 ? (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-medium text-sm">
              <AlertTriangle className="size-4" />
              تم اكتشاف محاور خيارات مكرّرة
            </div>
            <p className="text-xs">
              {`${formAxisDuplicateCount} محور مكرّر في النموذج تم تجاهله. احفظ المنتج لإعادة الكتابة بقائمة نظيفة.`}
            </p>
          </div>
        ) : null}

        {cartesianRows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            لا توجد متغيّرات. أضف خيارات في القسم أعلاه.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {productOptions.map((opt, idx) => (
                    <TableHead key={`${optionEn(opt)}-${idx}`}>
                      {optionAr(opt)}
                    </TableHead>
                  ))}
                  <TableHead>SKU</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>المخزون</TableHead>
                  <TableHead>التكلفة</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>نشط</TableHead>
                  <TableHead className="text-end">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartesianRows.map((row, rowIdx) => {
                  const attributes = cartesianAttributes[rowIdx]!
                  const sig = attributesSignature(attributes)
                  const variantIdx = variantIndexBySig.get(sig)
                  const variant: VariantRequest =
                    (variantIdx !== undefined
                      ? watchedVariants?.[variantIdx]
                      : undefined) ?? blankVariant(attributes)
                  const skuTrim = (variant.sku ?? "").trim()
                  const isDuplicateSku =
                    skuTrim.length > 0 && duplicateSkus.has(skuTrim)

                  return (
                    <TableRow key={sig}>
                      {row.map((value, axisIndex) => (
                        <TableCell
                          key={`${sig}-axis-${axisIndex}`}
                          className="font-medium"
                        >
                          {valueAr(value)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Input
                          value={variant.sku ?? ""}
                          onChange={(e) =>
                            updateVariantField(sig, { sku: e.target.value })
                          }
                          className={
                            "h-8 w-32 " +
                            (isDuplicateSku
                              ? "border-destructive ring-1 ring-destructive"
                              : "")
                          }
                          placeholder="SKU-001"
                          aria-invalid={isDuplicateSku ? "true" : "false"}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={variant.price ?? ""}
                          onChange={(e) =>
                            updateVariantField(sig, {
                              price:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                          className="h-8 w-24"
                          min={0}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={variant.stockQty ?? ""}
                          onChange={(e) =>
                            updateVariantField(sig, {
                              stockQty:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                          className="h-8 w-20"
                          min={0}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={variant.costPrice ?? ""}
                          onChange={(e) =>
                            updateVariantField(sig, {
                              costPrice:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                          className="h-8 w-24"
                          min={0}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={variant.barcode ?? ""}
                          onChange={(e) =>
                            updateVariantField(sig, {
                              barcode: e.target.value || null,
                            })
                          }
                          className="h-8 w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={variant.isActive ?? true}
                          onChange={(e) =>
                            updateVariantField(sig, {
                              isActive: e.target.checked,
                            })
                          }
                          className="size-4"
                        />
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1">
                          {variant.variantId ? (
                            <>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() =>
                                  openAdjust(
                                    variant.variantId!,
                                    skuTrim,
                                    variant.stockQty ?? undefined
                                  )
                                }
                                title="تعديل المخزون"
                              >
                                <Package className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() =>
                                  openHistory(variant.variantId!, skuTrim)
                                }
                                title="سجلّ الحركات"
                              >
                                <History className="size-4" />
                              </Button>
                            </>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              جديد
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {orphanServerVariants.length > 0 ? (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-destructive">
              تنبيه: {orphanServerVariants.length} متغيّر سيتم أرشفته عند الحفظ
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              المتغيّرات التالية لم تعد تنطبق على الخيارات الحالية:
            </p>
            <ul className="mt-2 flex flex-wrap gap-1">
              {orphanServerVariants.map((v) => (
                <li key={v.variantId}>
                  <Badge variant="outline">
                    {Object.entries(v.attributes ?? {})
                      .map(([k, val]) => `${k}: ${val}`)
                      .join(" / ") || (v.sku ?? "")}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>

      {activeVariantId ? (
        <>
          <InventoryAdjustModal
            open={adjustOpen}
            onOpenChange={setAdjustOpen}
            variantId={activeVariantId}
            variantSku={activeVariantSku}
            currentStock={activeVariantStock}
            productId={productId}
          />
          <VariantHistoryDrawer
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            variantId={activeVariantId}
            variantSku={activeVariantSku}
          />
        </>
      ) : null}
    </Card>
  )
}
