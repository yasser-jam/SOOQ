"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import DataTable from "@/components/system/table"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { toast } from "sonner"

import type { InventoryLowStockItem, BulkInventoryAdjustmentInput } from "@/modules/inventory/types"
import {
  getAllLowStockVariants,
  bulkAdjustInventory,
} from "@/modules/inventory/actions"
import { inventoryQueryKeys } from "@/modules/inventory/queryKeys"

export default function LowStockDashboardPage() {
  const queryClient = useQueryClient()
  const { data: items = [] } = useQuery(
    inventoryQueryKeys.lowStockAll(),
    getAllLowStockVariants
  )

  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  const [delta, setDelta] = React.useState(0)
  const [isOpen, setIsOpen] = React.useState(false)

  const { mutateAsync: doBulkAdjust, isLoading: adjusting } = useMutation({
    mutationFn: (payload: BulkInventoryAdjustmentInput) =>
      bulkAdjustInventory(payload),
    onSuccess: async () => {
      toast.success("تم تعديل المخزون بنجاح")
      setIsOpen(false)
      setSelected({})
      await queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all })
      await queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.lowStockAll() })
    },
    onError: () => {
      toast.error("فشل تعديل المخزون")
    },
  })

  const toggleSelect = (key: string) => {
    setSelected((s) => ({ ...s, [key]: !s[key] }))
  }

  const selectedItems = React.useMemo(() => {
    return items.filter((it) => selected[`${it.productId}:${it.variant.variantId}`])
  }, [items, selected])

  const onApply = async () => {
    if (!selectedItems.length) return toast.error("اختر عناصر للتعديل")
    if (!delta) return toast.error("ادخل قيمة صحيحة")

    const adjustments = selectedItems.map((it) => ({
      variantId: it.variant.variantId,
      quantityDelta: delta,
    }))

    await doBulkAdjust({ adjustments })
  }

  const columns: ColumnDef<InventoryLowStockItem>[] = [
    {
      id: "select",
      header: () => <div></div>,
      cell: ({ row }) => {
        const key = `${row.original.productId}:${row.original.variant.variantId}`
        return (
          <input
            type="checkbox"
            checked={!!selected[key]}
            onChange={() => toggleSelect(key)}
          />
        )
      },
    },
    {
      accessorKey: "productTitle",
      header: "المنتج",
      cell: ({ row }) => <span>{row.original.productTitle}</span>,
    },
    {
      id: "sku",
      header: "المخزون",
      cell: ({ row }) => (
        <div>
          <div className="text-sm">SKU: {row.original.variant.sku}</div>
          <div className="text-sm">Qty: {row.original.variant.stockQty}</div>
        </div>
      ),
    },
    {
      id: "threshold",
      header: "الحد الادنى",
      cell: ({ row }) => <span>{row.original.variant.lowStockThreshold ?? "-"}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">منتجات منخفضة المخزون</h2>
        <div className="flex items-center gap-2">
          <Input
            value={delta}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDelta(Number(e.target.value))}
            type="number"
            placeholder="Delta"
            className="w-28"
          />
          <Button onClick={() => setIsOpen(true)} disabled={!Object.values(selected).some(Boolean)}>
            تعديل جماعي
          </Button>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-lg border">
        <DataTable columns={columns} data={items} />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />
          <div className="z-10 w-full max-w-md rounded bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">تأكيد التعديل الجماعي</h3>
            <p className="mb-4">سيتم تطبيق القيمة {delta} على العناصر المحددة ({selectedItems.length})</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={onApply} loading={adjusting}>
                تطبيق
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
