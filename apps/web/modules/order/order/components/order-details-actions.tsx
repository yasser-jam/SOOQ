"use client"

import { useState } from "react"
import { CircleCheck, PenLine, Router } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import OrderEditDialog from "./order-edit-dialog"
import { useRouter } from "next/navigation"

interface OrderDetailsActionsProps {
  orderId: string
}

export default function OrderDetailsActions({
  orderId,
}: OrderDetailsActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const router = useRouter()

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="button" size="md" variant="outline" onClick={() => router.push('/orders/${orderId}/returns')}>
          رد الأموال
        </Button>

        <Button
          type="button"
          size="md"
          variant="outline"
          onClick={() => setIsEditDialogOpen(true)}
        >
          تعديل الطلب
          <PenLine data-icon="inline-end" />
        </Button>

        <Button
          type="button"
          size="md"
          variant="secondary"
          aria-label={`طباعة فاتورة الطلب ${orderId}`}
        >
          طباعة فاتورة
          <CircleCheck data-icon="inline-end" />
        </Button>
      </div>

      <OrderEditDialog
        orderId={orderId}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  )
}
