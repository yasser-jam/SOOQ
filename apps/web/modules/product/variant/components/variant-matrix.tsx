"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useFormContext, useWatch } from "react-hook-form"
import { AlertTriangle, History, Loader2, Package, Save } from "lucide-react"
import { toast } from "sonner"

import InventoryAdjustModal from "@/modules/inventory/components/adjust-modal"
import VariantHistoryDrawer from "@/modules/inventory/components/variant-history-drawer"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import {
  getVariantMatrix,
  saveVariantMatrix,
  updateSingleVariant,
} from "@/modules/product/variant/actions"
import { variantQueryKeys } from "@/modules/product/variant/queryKeys"
import { productKeys } from "@/modules/product/product/queryKeys"
import { inventoryQueryKeys } from "@/modules/inventory/queryKeys"
import type {
  SingleVariantUpdate,
  VariantDto,
  VariantMatrixRequest,
  VariantOptionDto,
} from "@/modules/product/variant/types"
/**
 * Defensive view that accepts both:
 *  - the form schema shape (optionNameAr/optionNameEn, values[].valueAr/valueEn)
 *  - the normalized server shape (titleAr/titleEn) returned by getProduct
 *
 * The codebase has a known mismatch between productOptionSchema and
 * normalizeGetProduct; rather than fix it here, we read both names safely.
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

type Props = {
  productId: string
  isEdit: boolean
}

type CellState = {
  sku: string
  price: string
  stockQty: string
  costPrice: string
  barcode: string
  isActive: boolean
}

const emptyCell = (): CellState => ({
  sku: "",
  price: "",
  stockQty: "",
  costPrice: "",
  barcode: "",
  isActive: true,
})

const cartesian = <T,>(arrays: T[][]): T[][] => {
  if (arrays.length === 0) return []
  return arrays.reduce<T[][]>(
    (acc, current) => acc.flatMap((row) => current.map((item) => [...row, item])),
    [[]]
  )
}

const composeKey = (values: OptionValueView[]): string =>
  values.map((v) => valueEn(v) || valueAr(v)).join("|")

const composeKeyFromDto = (
  values: { valueAr: string; valueEn: string }[]
): string => values.map((v) => v.valueEn || v.valueAr).join("|")

/**
 * Variant Matrix editor (PRD-002, PRD-018).
 *
 * - Reads option axes from the parent product form (`options` field).
 * - Generates the Cartesian product of all option values into rows.
 * - Each row is editable: SKU / price / stock / cost / barcode / active.
 * - On "حفظ المصفوفة" → bulk PUT regenerates server-side.
 * - On per-cell save (after matrix exists with variantId) → single PUT.
 */
export default function VariantMatrix({ productId, isEdit }: Props) {
  const queryClient = useQueryClient()
  const form = useFormContext()

  const watchedOptions = useWatch({
    control: form.control,
    name: "options",
  }) as OptionView[] | undefined
  // Dedupe by option name (case-insensitive). Backend has been observed to
  // emit duplicate axes when a product is saved multiple times without
  // productOptionId echoed back; we collapse them here so the matrix stays
  // sane until the user re-saves the matrix to clean it up server-side.
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

  // Cells keyed by composed option key (e.g. "S|Red")
  const [cells, setCells] = useState<Record<string, CellState>>({})
  // Snapshot of what the server returned, by the same composed key. Used to
  // diff per-cell saves so we only PUT fields the user actually changed —
  // important because backend rejects re-PUTting an unchanged SKU as "already
  // exists" (uniqueness check doesn't always exclude self-reference).
  const [serverSnapshot, setServerSnapshot] = useState<
    Record<string, CellState>
  >({})

  // Adjust modal + history drawer state
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

  const { data: matrix, isLoading: isMatrixLoading } = useQuery({
    queryKey: variantQueryKeys.matrix(productId),
    queryFn: () => getVariantMatrix(productId),
    enabled: isEdit && Boolean(productId),
  })

  /**
   * After any matrix mutation we must invalidate three places:
   *  1. the matrix query itself (so the table refetches options + variants)
   *  2. the product detail query that backs the editor (basics tab, options
   *     dialog, etc. all read from the product detail) — without this the
   *     30s staleTime would serve cached pre-save data when the user
   *     navigates back to /products/[id]
   *  3. the inventory status for this product (stock changes here propagate)
   */
  const invalidateAfterMatrixMutation = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: variantQueryKeys.matrix(productId),
    })
    queryClient.invalidateQueries({
      queryKey: productKeys.detail(productId),
    })
    queryClient.invalidateQueries({
      queryKey: inventoryQueryKeys.status(productId),
    })
  }, [queryClient, productId])

  const { mutate: bulkSave, isPending: isBulkSaving } = useMutation({
    mutationFn: (payload: VariantMatrixRequest) =>
      saveVariantMatrix(productId, payload),
    onSuccess: () => {
      toast.success("تم حفظ مصفوفة المتغيّرات")
      invalidateAfterMatrixMutation()
    },
  })

  const { mutate: cellSave, isPending: isCellSaving } = useMutation({
    mutationFn: ({
      variantId,
      patch,
    }: {
      variantId: string
      patch: SingleVariantUpdate
    }) => updateSingleVariant(productId, variantId, patch),
    onSuccess: () => {
      toast.success("تم تحديث المتغيّر")
      invalidateAfterMatrixMutation()
    },
  })

  // Hydrate cell state + server snapshot from API response (for edit mode).
  // The snapshot is the source of truth for "what does the server have today";
  // diffing against it lets per-cell save send only changed fields.
  useEffect(() => {
    if (!matrix?.variants) return
    const next: Record<string, CellState> = {}
    for (const v of matrix.variants) {
      const key = v.optionKey ?? ""
      if (!key) continue
      next[key] = {
        sku: v.sku ?? "",
        price: v.price != null ? String(v.price) : "",
        stockQty: v.stockQty != null ? String(v.stockQty) : "",
        costPrice: v.costPrice != null ? String(v.costPrice) : "",
        barcode: v.barcode ?? "",
        isActive: v.isActive ?? true,
      }
    }
    setServerSnapshot(next)
    // Don't clobber in-flight user edits — only fill cells the user hasn't touched
    setCells((prev) => ({ ...next, ...prev }))
  }, [matrix])

  // Cartesian product of option values
  const rows = useMemo(() => {
    if (productOptions.length === 0) return [] as OptionValueView[][]
    const valuesPerAxis = productOptions.map((opt) => opt.values)
    return cartesian(valuesPerAxis)
  }, [productOptions])

  // Find SKUs that appear on more than one cell — backend's uniqueness
  // constraint (ERR_1003) will reject a save with duplicates.
  const duplicateSkus = useMemo(() => {
    const counts = new Map<string, number>()
    for (const row of rows) {
      const key = composeKey(row)
      const sku = (cells[key]?.sku ?? "").trim()
      if (!sku) continue
      counts.set(sku, (counts.get(sku) ?? 0) + 1)
    }
    return new Set(
      Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([sku]) => sku)
    )
  }, [rows, cells])

  const handleCellChange = useCallback(
    (key: string, field: keyof CellState, value: string | boolean) => {
      setCells((prev) => ({
        ...prev,
        [key]: { ...(prev[key] ?? emptyCell()), [field]: value },
      }))
    },
    []
  )

  const handleBulkSave = useCallback(() => {
    if (productOptions.length === 0) {
      toast.error("أضف خيارات أولاً قبل حفظ المصفوفة")
      return
    }
    if (rows.length === 0) {
      toast.error("لا توجد متغيّرات لتوليدها — تحقّق من قيم الخيارات")
      return
    }
    if (duplicateSkus.size > 0) {
      toast.error(
        `لا يمكن الحفظ — الرموز التالية مكرّرة: ${Array.from(duplicateSkus).join(", ")}`
      )
      return
    }

    const optionsDto: VariantOptionDto[] = productOptions.map((opt, i) => ({
      optionNameAr: optionAr(opt),
      optionNameEn: optionEn(opt),
      sortOrder: i,
      values: opt.values.map((v, vi) => ({
        valueAr: valueAr(v),
        valueEn: valueEn(v),
        colorHex: v.colorHex ?? undefined,
        sortOrder: vi,
      })),
    }))

    const variantOverrides: Record<string, Partial<VariantDto>> = {}
    for (const row of rows) {
      const key = composeKey(row)
      const cell = cells[key] ?? emptyCell()
      variantOverrides[key] = {
        sku: cell.sku,
        price: cell.price ? Number(cell.price) : 0,
        stockQty: cell.stockQty ? Number(cell.stockQty) : 0,
        costPrice: cell.costPrice ? Number(cell.costPrice) : null,
        barcode: cell.barcode || null,
        isActive: cell.isActive,
      }
    }

    bulkSave({ options: optionsDto, variantOverrides })
  }, [productOptions, rows, cells, bulkSave, duplicateSkus])

  const handleCellSave = useCallback(
    (key: string) => {
      const variant = matrix?.variants.find((v) => v.optionKey === key)
      if (!variant?.variantId) {
        toast.error("احفظ المصفوفة أولاً قبل التعديل الفردي")
        return
      }
      const current = cells[key] ?? emptyCell()
      const original = serverSnapshot[key] ?? emptyCell()

      // Quick exit: nothing changed → don't hit the backend.
      const isSame =
        current.sku === original.sku &&
        current.price === original.price &&
        current.stockQty === original.stockQty &&
        current.costPrice === original.costPrice &&
        current.barcode === original.barcode &&
        current.isActive === original.isActive
      if (isSame) {
        toast("لا تغييرات للحفظ في هذا الصف")
        return
      }

      // Frontend pre-flight: catch LOCAL SKU duplicates (between matrix rows)
      // before round-tripping. Backend uniqueness check excludes self-reference
      // (existsBySkuAndVariantIdNot) so legitimate unchanged-SKU saves pass —
      // only collisions with OTHER variants in the same tenant trigger backend
      // ERR_1003.
      const skuTrim = current.sku.trim()
      if (skuTrim && duplicateSkus.has(skuTrim)) {
        toast.error(
          `الرمز "${current.sku}" مكرّر على صفّ آخر — غيّر أحدهما قبل الحفظ`
        )
        return
      }

      // Send the FULL ProductVariantUpdateDto. Backend marks sku/price/
      // stockQty/isActive as @NotBlank/@NotNull so partial PATCH-style
      // payloads get rejected with VALIDATION_ERROR.
      const patch: SingleVariantUpdate = {
        sku: current.sku,
        price: current.price ? Number(current.price) : 0,
        stockQty: current.stockQty ? Number(current.stockQty) : 0,
        isActive: current.isActive,
        costPrice: current.costPrice ? Number(current.costPrice) : null,
        barcode: current.barcode || null,
      }

      cellSave({ variantId: variant.variantId, patch })
    },
    [matrix, cells, serverSnapshot, cellSave, duplicateSkus]
  )

  // Show server-known variants the new options no longer cover (will be soft-deleted on bulk save)
  const orphanVariants = useMemo(() => {
    if (!matrix?.variants) return []
    const validKeys = new Set(rows.map(composeKey))
    return matrix.variants.filter(
      (v) => v.optionKey && !validKeys.has(v.optionKey)
    )
  }, [matrix, rows])

  if (!isEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>مصفوفة المتغيّرات</CardTitle>
          <CardDescription>
            احفظ المنتج أولاً لتوليد المتغيّرات.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            بعد إضافة الخيارات وحفظ المنتج، ستتمكّن من إدارة كل متغيّر (SKU،
            السعر، المخزون، التكلفة) من هذا الجدول.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>مصفوفة المتغيّرات</CardTitle>
        <CardDescription>
          {productOptions.length === 0
            ? "أضف خيارات (Size, Color...) من تبويب الخيارات لتوليد المصفوفة."
            : `الإجمالي: ${rows.length} متغيّر (${productOptions.length} محور)`}
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            onClick={handleBulkSave}
            disabled={isBulkSaving || rows.length === 0}
          >
            {isBulkSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            حفظ المصفوفة
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {(matrix?.duplicateOptionCount ?? 0) > 0 ||
        formAxisDuplicateCount > 0 ? (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-medium text-sm">
              <AlertTriangle className="size-4" />
              تم اكتشاف محاور خيارات مكرّرة
            </div>
            <p className="text-xs">
              {matrix?.duplicateOptionCount
                ? `${matrix.duplicateOptionCount} محور إضافي على الخادم بنفس الاسم — `
                : ""}
              {formAxisDuplicateCount
                ? `${formAxisDuplicateCount} محور مكرّر في النموذج. `
                : ""}
              المحاور المكرّرة تم تجاهلها هنا. اضغط "حفظ المصفوفة" لإعادة كتابة
              الخيارات بقائمة نظيفة (سيمسح الخيارات المكرّرة من قاعدة البيانات).
            </p>
          </div>
        ) : null}
        {isMatrixLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            لا توجد متغيّرات. أضف خيارات في التبويب أعلاه.
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
                {rows.map((row) => {
                  const key = composeKey(row)
                  const cell = cells[key] ?? emptyCell()
                  const existingVariant = matrix?.variants.find(
                    (v) => v.optionKey === key
                  )
                  return (
                    <TableRow key={key}>
                      {row.map((value, axisIndex) => (
                        <TableCell
                          key={`${key}-axis-${axisIndex}`}
                          className="font-medium"
                        >
                          {valueAr(value)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Input
                          value={cell.sku}
                          onChange={(e) =>
                            handleCellChange(key, "sku", e.target.value)
                          }
                          className={
                            "h-8 w-32 " +
                            (cell.sku.trim() &&
                            duplicateSkus.has(cell.sku.trim())
                              ? "border-destructive ring-1 ring-destructive"
                              : "")
                          }
                          placeholder="SKU-001"
                          aria-invalid={
                            cell.sku.trim() &&
                            duplicateSkus.has(cell.sku.trim())
                              ? "true"
                              : "false"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={cell.price}
                          onChange={(e) =>
                            handleCellChange(key, "price", e.target.value)
                          }
                          className="h-8 w-24"
                          min={0}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={cell.stockQty}
                          onChange={(e) =>
                            handleCellChange(key, "stockQty", e.target.value)
                          }
                          className="h-8 w-20"
                          min={0}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={cell.costPrice}
                          onChange={(e) =>
                            handleCellChange(key, "costPrice", e.target.value)
                          }
                          className="h-8 w-24"
                          min={0}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={cell.barcode}
                          onChange={(e) =>
                            handleCellChange(key, "barcode", e.target.value)
                          }
                          className="h-8 w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={cell.isActive}
                          onChange={(e) =>
                            handleCellChange(key, "isActive", e.target.checked)
                          }
                          className="size-4"
                        />
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1">
                          {existingVariant?.variantId ? (
                            <>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() =>
                                  openAdjust(
                                    existingVariant.variantId!,
                                    cell.sku || existingVariant.sku || "",
                                    existingVariant.stockQty
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
                                  openHistory(
                                    existingVariant.variantId!,
                                    cell.sku || existingVariant.sku || ""
                                  )
                                }
                                title="سجلّ الحركات"
                              >
                                <History className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCellSave(key)}
                                disabled={isCellSaving}
                              >
                                حفظ
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

        {orphanVariants.length > 0 ? (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-destructive">
              تنبيه: {orphanVariants.length} متغيّر سيتم أرشفته عند الحفظ
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              المتغيّرات التالية لم تعد تنطبق على الخيارات الحالية:
            </p>
            <ul className="mt-2 flex flex-wrap gap-1">
              {orphanVariants.map((v) => (
                <li key={v.variantId}>
                  <Badge variant="outline">{v.optionKey ?? v.sku}</Badge>
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

// Re-exported so callers can build keys consistently outside the component.
export { composeKey, composeKeyFromDto }
