"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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

import { bulkAdjustInventory } from "@/modules/inventory/actions"
import { inventoryQueryKeys } from "@/modules/inventory/queryKeys"
import {
  INVENTORY_REASON_CODES,
  type InventoryReasonCode,
} from "@/modules/inventory/types"

const reasonLabels: Record<InventoryReasonCode, string> = {
  MANUAL_ADJUSTMENT: "تعديل يدوي",
  ORDER_PLACED: "طلب جديد",
  ORDER_CANCELLED: "إلغاء طلب",
  RETURN_APPROVED: "إرجاع",
  IMPORT: "استيراد",
}

type Row = {
  variantId: string
  delta: string
  reason: InventoryReasonCode
}

const blankRow = (): Row => ({
  variantId: "",
  delta: "",
  reason: "MANUAL_ADJUSTMENT",
})

export default function BulkAdjustPage() {
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<Row[]>([blankRow(), blankRow(), blankRow()])

  const updateRow = (index: number, patch: Partial<Row>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
    )
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
          أدخل قائمة تعديلات المخزون دفعة واحدة. تنفّذ كلها في طلب واحد.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم المتغيّر (variantId)</TableHead>
                <TableHead className="w-32">التغيير</TableHead>
                <TableHead className="w-48">السبب</TableHead>
                <TableHead className="w-16 text-end"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Input
                      value={row.variantId}
                      onChange={(e) =>
                        updateRow(i, { variantId: e.target.value })
                      }
                      placeholder="UUID"
                      dir="ltr"
                      disabled={isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.delta}
                      onChange={(e) => updateRow(i, { delta: e.target.value })}
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
              ))}
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
