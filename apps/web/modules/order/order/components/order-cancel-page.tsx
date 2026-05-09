"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

import PageDialog from "@/components/system/page-dialog"
import { cancelAdminOrder, getAdminOrder } from "@/modules/order/order/actions"
import { initOrderCancel } from "@/modules/order/order/init"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"

interface OrderCancelPageViewProps {
  orderId: string
}

export default function OrderCancelPageView({
  orderId,
}: OrderCancelPageViewProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [reason, setReason] = useState("")
  const { data: order } = useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => getAdminOrder(orderId),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: cancelAdminOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orderQueryKeys.all })
      router.push(`/orders/${orderId}`)
    },
  })

  return (
    <PageDialog
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
      size="sm"
      title="إلغاء الطلب"
      description={`الطلب: ${order?.orderNumber ?? order?.orderId ?? orderId}`}
      actions={
        <>
          <Button variant="outline" onClick={() => router.back()}>
            رجوع
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={!reason.trim() || isPending}
            onClick={() =>
              mutate(
                initOrderCancel(orderId, {
                  reason: reason.trim(),
                })
              )
            }
          >
            تأكيد الإلغاء
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Alert
          variant="destructive"
          className="rounded-2xl border-destructive/50 bg-destructive/5 px-5 py-4"
        >
          <AlertTriangle className="my-auto me-4 size-6" />
          <AlertDescription className="text-base leading-relaxed text-destructive">
            هذا الإجراء سيغيّر حالة الطلب إلى ملغي، لذلك من الأفضل توثيق سبب
            الإلغاء بشكل واضح.
          </AlertDescription>
        </Alert>

        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="اكتب سبب الإلغاء..."
          className="min-h-32"
          disabled={isPending}
        />
      </div>
    </PageDialog>
  )
}
