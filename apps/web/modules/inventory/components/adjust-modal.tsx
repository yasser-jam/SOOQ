"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Field as UiField,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { adjustInventory } from "@/modules/inventory/actions"
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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  variantId: string
  variantSku?: string
  currentStock?: number
  /** Used to invalidate the parent product's status query on success. */
  productId?: string
}

export default function InventoryAdjustModal({
  open,
  onOpenChange,
  variantId,
  variantSku,
  currentStock,
  productId,
}: Props) {
  const queryClient = useQueryClient()

  const [delta, setDelta] = useState("0")
  const [reason, setReason] = useState<InventoryReasonCode>("MANUAL_ADJUSTMENT")

  // Reset form whenever the modal is reopened
  useEffect(() => {
    if (open) {
      setDelta("0")
      setReason("MANUAL_ADJUSTMENT")
    }
  }, [open])

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      adjustInventory({
        variantId,
        quantityDelta: Number(delta),
        reasonCode: reason,
      }),
    onSuccess: () => {
      toast.success("تم تعديل المخزون")
      if (productId) {
        queryClient.invalidateQueries({
          queryKey: inventoryQueryKeys.status(productId),
        })
        queryClient.invalidateQueries({
          queryKey: inventoryQueryKeys.lowStock(productId),
        })
      }
      queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.movementList(variantId),
      })
      onOpenChange(false)
    },
  })

  const previewStock =
    currentStock != null && delta !== "" && !Number.isNaN(Number(delta))
      ? currentStock + Number(delta)
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل مخزون المتغيّر</DialogTitle>
          <DialogDescription>
            {variantSku ? (
              <>
                SKU: <span dir="ltr">{variantSku}</span>
              </>
            ) : (
              <>المتغيّر: {variantId}</>
            )}
            {currentStock != null ? (
              <span className="ms-2 text-muted-foreground">
                (المخزون الحالي: {currentStock})
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <UiField>
            <FieldLabel htmlFor="quantityDelta">
              تغيير الكميّة (موجب = إضافة، سالب = إنقاص)
            </FieldLabel>
            <Input
              id="quantityDelta"
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              disabled={isPending}
              dir="ltr"
            />
            {previewStock != null ? (
              <FieldDescription>
                المخزون بعد التعديل:{" "}
                <span
                  className={
                    previewStock < 0
                      ? "text-destructive font-medium"
                      : "font-medium"
                  }
                >
                  {previewStock}
                </span>
              </FieldDescription>
            ) : null}
          </UiField>

          <UiField>
            <FieldLabel htmlFor="reasonCode">سبب التعديل</FieldLabel>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as InventoryReasonCode)}
              disabled={isPending}
            >
              <SelectTrigger id="reasonCode">
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
          </UiField>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={isPending}>
              إلغاء
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={() => mutate()}
            disabled={isPending || delta === "" || Number(delta) === 0}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            حفظ التعديل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
