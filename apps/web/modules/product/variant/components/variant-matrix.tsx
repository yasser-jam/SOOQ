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
import { Switch } from "@workspace/ui/components/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"

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
// valueAr; both fall back to the EN sibling when AR is empty.
const axisKeyOf = (opt: OptionView): string =>
  (optionAr(opt) || optionEn(opt)).trim()
const valueLabelOf = (v: OptionValueView): string =>
  (valueAr(v) || valueEn(v)).trim()

/** Compact, muted column labels — overrides the default bold TableHead styles. */
const TABLE_HEAD_CLASS =
  "h-8 px-2 text-xs font-normal text-muted-foreground"

const INPUT_CLASS = "h-8 text-sm"

type Props = {
  productId: string
}

/** Builds the Cartesian product of option value arrays (one row per variant combo). */
const cartesian = <T,>(arrays: T[][]): T[][] => {
  if (arrays.length === 0) return []
  return arrays.reduce<T[][]>(
    (acc, current) => acc.flatMap((row) => current.map((item) => [...row, item])),
    [[]]
  )
}

/** Stable signature for an attributes map (order-independent matching). */
const attributesSignature = (attributes: Record<string, string>): string =>
  Object.keys(attributes)
    .sort()
    .map((k) => `${k}=${attributes[k]}`)
    .join("|")

const blankVariant = (attributes: Record<string, string>): VariantRequest => ({
  attributes,
  isActive: true,
})

/** Parses numeric inputs: empty string → null, otherwise Number(). */
const parseOptionalNumber = (raw: string): number | null =>
  raw === "" ? null : Number(raw)

/** Collapses duplicate option axes (case-insensitive) from legacy server data. */
const dedupeOptions = (options: OptionView[]): OptionView[] => {
  const seen = new Set<string>()
  const out: OptionView[] = []
  for (const option of options) {
    const key = (optionEn(option) || optionAr(option)).trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(option)
  }
  return out
}

/** Returns SKUs that appear more than once in the current variants list. */
const findDuplicateSkus = (variants: VariantRequest[] | undefined): Set<string> => {
  const counts = new Map<string, number>()
  for (const variant of variants ?? []) {
    const sku = (variant.sku ?? "").trim()
    if (!sku) continue
    counts.set(sku, (counts.get(sku) ?? 0) + 1)
  }
  return new Set(
    Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([sku]) => sku)
  )
}

type VariantMatrixRowProps = {
  row: OptionValueView[]
  sig: string
  variant: VariantRequest
  isDuplicateSku: boolean
  onFieldChange: (sig: string, patch: Partial<VariantRequest>) => void
  onAdjust: (variantId: string, sku: string, stock: number | undefined) => void
  onHistory: (variantId: string, sku: string) => void
}

/** Single matrix row — axis labels plus editable variant fields. */
function VariantMatrixRow({
  row,
  sig,
  variant,
  isDuplicateSku,
  onFieldChange,
  onAdjust,
  onHistory,
}: VariantMatrixRowProps) {
  const skuTrim = (variant.sku ?? "").trim()

  return (
    <TableRow>
      {row.map((value, axisIndex) => (
        <TableCell
          key={`${sig}-axis-${axisIndex}`}
          className="text-sm font-medium"
        >
          {valueAr(value)}
        </TableCell>
      ))}

      <TableCell>
        <Input
          value={variant.sku ?? ""}
          onChange={(e) => onFieldChange(sig, { sku: e.target.value })}
          className={cn(
            INPUT_CLASS,
            "w-32",
            isDuplicateSku && "border-destructive ring-1 ring-destructive"
          )}
          placeholder="SKU-001"
          aria-invalid={isDuplicateSku}
        />
      </TableCell>

      <TableCell>
        <Input
          type="number"
          value={variant.price ?? ""}
          onChange={(e) =>
            onFieldChange(sig, { price: parseOptionalNumber(e.target.value) })
          }
          className={cn(INPUT_CLASS, "w-24")}
          min={0}
        />
      </TableCell>

      <TableCell>
        <Input
          type="number"
          value={variant.stockQty ?? ""}
          onChange={(e) =>
            onFieldChange(sig, { stockQty: parseOptionalNumber(e.target.value) })
          }
          className={cn(INPUT_CLASS, "w-20")}
          min={0}
        />
      </TableCell>

      <TableCell>
        <Input
          type="number"
          value={variant.costPrice ?? ""}
          onChange={(e) =>
            onFieldChange(sig, {
              costPrice: parseOptionalNumber(e.target.value),
            })
          }
          className={cn(INPUT_CLASS, "w-24")}
          min={0}
        />
      </TableCell>

      <TableCell>
        <Input
          value={variant.barcode ?? ""}
          onChange={(e) =>
            onFieldChange(sig, { barcode: e.target.value || null })
          }
          className={cn(INPUT_CLASS, "w-28")}
        />
      </TableCell>

      <TableCell>
        <Switch
          checked={variant.isActive ?? true}
          onCheckedChange={(checked) =>
            onFieldChange(sig, { isActive: checked })
          }
          aria-label="نشط"
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
                className="size-8"
                onClick={() =>
                  onAdjust(
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
                className="size-8"
                onClick={() => onHistory(variant.variantId!, skuTrim)}
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
}

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

  // Snapshot of server variants at hydration — used only for the orphan warning.
  const [originalServerVariants, setOriginalServerVariants] = useState<
    VariantRequest[] | null
  >(null)
  useEffect(() => {
    if (originalServerVariants !== null) return
    if (!watchedVariants?.length) return
    if (!watchedVariants.some((v) => v.variantId)) return
    setOriginalServerVariants(
      watchedVariants.map((v) => ({
        ...v,
        attributes: { ...v.attributes },
      }))
    )
  }, [watchedVariants, originalServerVariants])

  const productOptions = useMemo(
    () => dedupeOptions(watchedOptions ?? []),
    [watchedOptions]
  )

  const formAxisDuplicateCount =
    (watchedOptions?.length ?? 0) - productOptions.length

  const cartesianRows = useMemo(() => {
    if (productOptions.length === 0) return [] as OptionValueView[][]
    return cartesian(productOptions.map((opt) => opt.values ?? []))
  }, [productOptions])

  // Canonical `{ axisKey: valueLabel }` map per matrix row (backend shape).
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

  // Keep form.variants aligned with the current Cartesian product.
  useEffect(() => {
    const current = (watchedVariants ?? []) as VariantRequest[]
    const bySig = new Map<string, VariantRequest>()
    for (const variant of current) {
      bySig.set(attributesSignature(variant.attributes ?? {}), variant)
    }

    const next: VariantRequest[] = cartesianAttributes.map((attributes) => {
      const sig = attributesSignature(attributes)
      const existing = bySig.get(sig)
      return existing ? { ...existing, attributes } : blankVariant(attributes)
    })

    const isSame =
      current.length === next.length &&
      current.every((variant, index) => {
        const target = next[index]
        return (
          target !== undefined &&
          attributesSignature(variant.attributes ?? {}) ===
            attributesSignature(target.attributes ?? {}) &&
          variant.sku === target.sku &&
          variant.price === target.price &&
          variant.stockQty === target.stockQty &&
          variant.costPrice === target.costPrice &&
          variant.barcode === target.barcode &&
          variant.isActive === target.isActive &&
          variant.variantId === target.variantId
        )
      })

    if (!isSame) {
      form.setValue("variants", next, {
        shouldDirty: current.length !== 0 || next.length !== 0,
        shouldValidate: false,
      })
    }
  }, [cartesianAttributes, watchedVariants, form])

  const orphanServerVariants = useMemo(() => {
    if (!originalServerVariants) return []
    const validSigs = new Set(cartesianAttributes.map(attributesSignature))
    return originalServerVariants.filter(
      (variant) =>
        variant.variantId &&
        !validSigs.has(attributesSignature(variant.attributes ?? {}))
    )
  }, [cartesianAttributes, originalServerVariants])

  const duplicateSkus = useMemo(
    () => findDuplicateSkus(watchedVariants),
    [watchedVariants]
  )

  const variantIndexBySig = useMemo(() => {
    const map = new Map<string, number>()
    ;(watchedVariants ?? []).forEach((variant, index) => {
      map.set(attributesSignature(variant.attributes ?? {}), index)
    })
    return map
  }, [watchedVariants])

  const updateVariantField = useCallback(
    (sig: string, patch: Partial<VariantRequest>) => {
      const current = (form.getValues("variants") ?? []) as VariantRequest[]
      const index = variantIndexBySig.get(sig)
      if (index === undefined) return
      const next = [...current]
      next[index] = { ...current[index]!, ...patch }
      form.setValue("variants", next, {
        shouldDirty: true,
        shouldValidate: false,
      })
    },
    [form, variantIndexBySig]
  )

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null)
  const [activeVariantSku, setActiveVariantSku] = useState("")
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

  const matrixColumnLabels = [
    ...productOptions.map((opt) => optionAr(opt)),
    "SKU",
    "السعر",
    "المخزون",
    "التكلفة",
    "Barcode",
    "نشط",
    "إجراء",
  ]

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
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
            <div className="flex items-center gap-2 text-sm font-medium">
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
                  {matrixColumnLabels.map((label, index) => (
                    <TableHead
                      key={`${label}-${index}`}
                      className={cn(
                        TABLE_HEAD_CLASS,
                        index === matrixColumnLabels.length - 1 && "text-end"
                      )}
                    >
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartesianRows.map((row, rowIdx) => {
                  const attributes = cartesianAttributes[rowIdx]!
                  const sig = attributesSignature(attributes)
                  const variantIdx = variantIndexBySig.get(sig)
                  const variant =
                    (variantIdx !== undefined
                      ? watchedVariants?.[variantIdx]
                      : undefined) ?? blankVariant(attributes)
                  const skuTrim = (variant.sku ?? "").trim()

                  return (
                    <VariantMatrixRow
                      key={sig}
                      row={row}
                      sig={sig}
                      variant={variant}
                      isDuplicateSku={
                        skuTrim.length > 0 && duplicateSkus.has(skuTrim)
                      }
                      onFieldChange={updateVariantField}
                      onAdjust={openAdjust}
                      onHistory={openHistory}
                    />
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
              {orphanServerVariants.map((variant) => (
                <li key={variant.variantId}>
                  <Badge variant="outline">
                    {Object.entries(variant.attributes ?? {})
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" / ") || (variant.sku ?? "")}
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
