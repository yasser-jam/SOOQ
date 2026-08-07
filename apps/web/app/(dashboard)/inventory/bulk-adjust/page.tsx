"use client"

import { useState } from "react"
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import {
  bulkAdjustInventory,
  getProductInventoryStatus,
} from "@/modules/inventory/actions"
import { inventoryQueryKeys } from "@/modules/inventory/queryKeys"
import {
  INVENTORY_REASON_CODES,
  type InventoryReasonCode,
} from "@/modules/inventory/types"
import { listProducts } from "@/modules/product/product/actions"
import { productKeys } from "@/modules/product/product/queryKeys"

const reasonLabels: Record<InventoryReasonCode, string> = {
  MANUAL_ADJUSTMENT: "تعديل يدوي",
  ORDER_PLACED: "طلب جديد",
  ORDER_CANCELLED: "إلغاء طلب",
  RETURN_APPROVED: "إرجاع",
  IMPORT: "استيراد",
}

type Row = {
  productId: string
  variantId: string
  delta: string
  reason: InventoryReasonCode
}

const blankRow = (): Row => ({
  productId: "",
  variantId: "",
  delta: "",
  reason: "MANUAL_ADJUSTMENT",
})

export default function BulkAdjustPage() {
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<Row[]>([blankRow(), blankRow(), blankRow()])

  // Catalog: products picker for the first column.
  const { data: productsResponse, isLoading: isLoadingProducts } = useQuery({
    queryKey: productKeys.all,
    queryFn: listProducts,
  })
  const products = productsResponse?.data ?? []

  // Variants per chosen product. `useQueries` so each row can fetch
  // independently; React Query caches per productId so adding multiple rows
  // for the same product only fires one request.
  const selectedProductIds = Array.from(
    new Set(rows.map((r) => r.productId).filter(Boolean))
  )
  const variantQueries = useQueries({
    queries: selectedProductIds.map((productId) => ({
      queryKey: inventoryQueryKeys.status(productId),
      queryFn: () => getProductInventoryStatus(productId),
    })),
  })
  const variantsByProduct: Record<
    string,
    Awaited<ReturnType<typeof getProductInventoryStatus>>
  > = {}
  selectedProductIds.forEach((productId, i) => {
    const result = variantQueries[i]?.data
    if (result) variantsByProduct[productId] = result
  })

  const updateRow = (index: number, patch: Partial<Row>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
    )
  }

  // When the product changes, drop the previously-selected variant since it
  // belongs to a different product.
  const handleProductChange = (index: number, productId: string) => {
    updateRow(index, { productId, variantId: "" })
  }

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const addRow = () => setRows((prev) => [...prev, blankRow()])

  const validRows = rows.filter(
    (r) => r.variantId.trim() && r.delta !== "" && Number(r.delta) !== 0
  )

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      bulkAdjustInventory({
        adjustments: validRows.map((r) => ({
          variantId: r.variantId.trim(),
          quantityDelta: Number(r.delta),
          reasonCode: r.reason,
        })),
      }),
    onSuccess: () => {
      toast.success(`تم تعديل ${validRows.length} متغيّر`)
      // Invalidate all inventory queries — we don't know which products were touched
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all })
      setRows([blankRow(), blankRow(), blankRow()])
    },
  })

  return (
    <div className="container">
      <div className="my-6 flex flex-col gap-1">
        <div className="page-title">تعديل مخزون متعدّد</div>
        <p className="text-sm text-muted-foreground">
          اختر المنتج ثم المتغيّر لكل صف، أدخل قيمة التعديل، ثم نفّذ الكل دفعة
          واحدة.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المنتج</TableHead>
                <TableHead>المتغيّر</TableHead>
                <TableHead className="w-32">التغيير</TableHead>
                <TableHead className="w-48">السبب</TableHead>
                <TableHead className="w-16 text-end"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => {
                const variantsForRow = row.productId
                  ? variantsByProduct[row.productId] ?? []
                  : []
                const isLoadingVariants =
                  row.productId &&
                  variantQueries[selectedProductIds.indexOf(row.productId)]
                    ?.isLoading

                return (
                  <TableRow key={i}>
                    <TableCell>
                      <Select
                        value={row.productId}
                        onValueChange={(v) => handleProductChange(i, v)}
                        disabled={isPending || isLoadingProducts}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              isLoadingProducts
                                ? "جارٍ تحميل المنتجات..."
                                : "اختر المنتج"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id ?? ""}>
                              {product.titleAr || product.titleEn || product.slug}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.variantId}
                        onValueChange={(v) => updateRow(i, { variantId: v })}
                        disabled={isPending || !row.productId || !!isLoadingVariants}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              !row.productId
                                ? "اختر المنتج أولاً"
                                : isLoadingVariants
                                  ? "جارٍ تحميل المتغيّرات..."
                                  : variantsForRow.length === 0
                                    ? "لا توجد متغيّرات"
                                    : "اختر المتغيّر"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {variantsForRow.map((variant) => (
                            <SelectItem
                              key={variant.variantId}
                              value={variant.variantId}
                            >
                              {variant.sku} — الرصيد: {variant.stockQty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row.delta}
                        onChange={(e) =>
                          updateRow(i, { delta: e.target.value })
                        }
                        placeholder="±"
                        dir="ltr"
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.reason}
                        onValueChange={(v) =>
                          updateRow(i, { reason: v as InventoryReasonCode })
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INVENTORY_REASON_CODES.map((code) => (
                            <SelectItem key={code} value={code}>
                              {reasonLabels[code]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(i)}
                        disabled={isPending || rows.length <= 1}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={addRow}
            disabled={isPending}
          >
            <Plus className="size-4" />
            إضافة صف
          </Button>

          <div className="flex items-center gap-3">
            <Badge variant="secondary">{validRows.length} صفّ صالح</Badge>
            <Button
              type="button"
              onClick={() => mutate()}
              disabled={isPending || validRows.length === 0}
            >
              تنفيذ التعديلات
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
