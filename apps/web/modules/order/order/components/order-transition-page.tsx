"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CircleCheck } from "lucide-react"
import { useRouter } from "next/navigation"

import PageDialog from "@/components/system/page-dialog"
import { useStorePath } from "@/lib/store-path"
import { getAdminOrder, transitionAdminOrderStatus } from "@/modules/order/order/actions"
import { initOrderTransition } from "@/modules/order/order/init"
import { ORDER_LIST_STATUS_META } from "@/modules/order/order/model"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import type { TransitionableOrderStatus } from "@/modules/order/order/types"
import { Button } from "@workspace/ui/components/button"

interface OrderTransitionPageViewProps {
  orderId: string
}

const ORDER_TRANSITION_TARGETS: TransitionableOrderStatus[] = [
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
  "FAILED",
]

export default function OrderTransitionPageView({
  orderId,
}: OrderTransitionPageViewProps) {
  const router = useRouter()
  const storePath = useStorePath()
  const queryClient = useQueryClient()
  const { data: order } = useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => getAdminOrder(orderId),
  })

  const [targetStatus, setTargetStatus] =
    useState<TransitionableOrderStatus>("CONFIRMED")

  const { mutate, isPending } = useMutation({
    mutationFn: transitionAdminOrderStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orderQueryKeys.all })
      router.push(storePath(`/orders/${orderId}`))
    },
  })

  const title = useMemo(
    () => order?.orderNumber ?? order?.orderId ?? order?.id ?? orderId,
    [order?.id, order?.orderId, order?.orderNumber, orderId]
  )

  return (
    <PageDialog
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
      size="md"
      title="تغيير حالة الطلب"
      description={`الطلب: ${title}`}
      actions={
        <>
          <Button variant="outline" onClick={() => router.back()}>
            إلغاء
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() =>
              mutate(
                initOrderTransition(orderId, {
                  targetStatus: targetStatus as TransitionableOrderStatus,
                })
              )
            }
          >
            حفظ الحالة
            <CircleCheck data-icon="inline-end" />
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
          الحالة الحالية:{" "}
          <span className="font-medium text-foreground">
            {order?.status ? ORDER_LIST_STATUS_META[order.status].label : "—"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ORDER_TRANSITION_TARGETS.map((status) => (
            <Button
              key={status}
              type="button"
              size="md"
              variant={targetStatus === status ? "secondary" : "outline"}
              className="h-14 justify-between"
              onClick={() => setTargetStatus(status)}
            >
              {ORDER_LIST_STATUS_META[status].label}
            </Button>
          ))}
        </div>
      </div>
    </PageDialog>
  )
}
