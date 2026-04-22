"use client"

import { CircleCheck, PenLine, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"

import type { OrderStatus } from "@/modules/order/order/types"
import { Button } from "@workspace/ui/components/button"

interface OrderDetailsActionsProps {
  orderId: string
  status?: OrderStatus
}

export default function OrderDetailsActions({
  orderId,
  status,
}: OrderDetailsActionsProps) {
  const router = useRouter()

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Button
        type="button"
        size="md"
        variant="outline"
        onClick={() => router.push(`/orders/${orderId}/returns`)}
      >
        رد الأموال
      </Button>

      <Button
        type="button"
        size="md"
        variant="outline"
        onClick={() => router.push(`/orders/${orderId}/edit`)}
      >
        تعديل الطلب
        <PenLine data-icon="inline-end" />
      </Button>

      <Button
        type="button"
        size="md"
        variant="outline"
        onClick={() => router.push(`/orders/${orderId}/transition`)}
      >
        تغيير الحالة
        <CircleCheck data-icon="inline-end" />
      </Button>

      {status !== "CANCELLED" ? (
        <Button
          type="button"
          size="md"
          variant="secondary"
          onClick={() => router.push(`/orders/${orderId}/cancel`)}
        >
          إلغاء الطلب
          <XCircle data-icon="inline-end" />
        </Button>
      ) : null}
    </div>
  )
}
