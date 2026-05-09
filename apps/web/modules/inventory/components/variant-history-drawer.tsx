"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { History } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { getVariantInventoryMovements } from "@/modules/inventory/actions"
import { inventoryQueryKeys } from "@/modules/inventory/queryKeys"

const reasonLabels: Record<string, string> = {
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
}

export default function VariantHistoryDrawer({
  open,
  onOpenChange,
  variantId,
  variantSku,
}: Props) {
  const [page, setPage] = useState(0)
  const pageSize = 20

  const { data, isPending } = useQuery({
    queryKey: inventoryQueryKeys.movements(variantId, { page, size: pageSize }),
    queryFn: () =>
      getVariantInventoryMovements(variantId, { page, size: pageSize }),
    enabled: open && Boolean(variantId),
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="size-5" />
            سجلّ حركات المخزون
          </SheetTitle>
          <SheetDescription>
            {variantSku ? (
              <>
                SKU: <span dir="ltr">{variantSku}</span>
              </>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-2">
          {isPending ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : !data || data.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              لا توجد حركات مخزون مسجّلة لهذا المتغيّر.
            </div>
          ) : (
            data.map((m) => (
              <div
                key={m.movementId}
                className="rounded-lg border p-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant={m.quantityDelta >= 0 ? "default" : "destructive"}
                  >
                    {m.quantityDelta >= 0 ? "+" : ""}
                    {m.quantityDelta}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(m.createdAt).toLocaleString("ar")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{reasonLabels[m.reasonCode] ?? m.reasonCode}</span>
                  <span className="text-muted-foreground">
                    الرصيد بعد: <span className="font-medium">{m.balanceAfter}</span>
                  </span>
                </div>
                {m.referenceType && m.referenceId ? (
                  <div className="text-xs text-muted-foreground" dir="ltr">
                    {m.referenceType}/{m.referenceId}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        {data && data.length >= pageSize ? (
          <SheetFooter className="flex-row gap-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isPending}
            >
              السابق
            </Button>
            <span className="text-sm text-muted-foreground self-center">
              صفحة {page + 1}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={isPending}
            >
              التالي
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
