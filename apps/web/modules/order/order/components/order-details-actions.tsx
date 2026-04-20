import { CircleCheck, PenLine } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

interface OrderDetailsActionsProps {
  orderId: string
}

export default function OrderDetailsActions({
  orderId,
}: OrderDetailsActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Button type="button" size="md" variant="outline">
        رد الأموال
      </Button>

      <Button type="button" size="md" variant="outline">
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
  )
}
