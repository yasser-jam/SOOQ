"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  CircleCheck,
  Cog,
  Download,
  FileText,
  PackageCheck,
  PenLine,
  Receipt,
  RefreshCcw,
  RotateCcw,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react"

import ConfirmAlert from "@/components/system/confirm-alert"
import { transitionAdminOrderStatus } from "@/modules/order/order/actions"
import { initOrderTransition } from "@/modules/order/order/init"
import {
  ALLOWED_ORDER_TRANSITIONS,
  CANCELLABLE_STATUSES,
  EDITABLE_STATUSES,
  ORDER_TRANSITION_ACTION_LABELS,
  REFUNDABLE_STATUSES,
} from "@/modules/order/order/model"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import type {
  OrderStatus,
  TransitionableOrderStatus,
} from "@/modules/order/order/types"
import {
  generateInvoice,
  regenerateInvoice,
} from "@/modules/order/invoice/actions"
import { invoiceQueryKeys } from "@/modules/order/invoice/queryKeys"
import { Button } from "@workspace/ui/components/button"

interface OrderDetailsActionsProps {
  orderId: string
  status?: OrderStatus
  invoiceNumber?: string | null
  invoicePdfUrl?: string | null
}

type IconType = typeof CheckCircle2

const TRANSITION_ICONS: Record<TransitionableOrderStatus, IconType> = {
  CONFIRMED: CheckCircle2,
  PROCESSING: Cog,
  SHIPPED: Truck,
  DELIVERED: PackageCheck,
  COMPLETED: CircleCheck,
  CANCELLED: XCircle,
  RETURNED: RotateCcw,
  REFUNDED: Wallet,
  FAILED: AlertTriangle,
}

const DESTRUCTIVE_TRANSITIONS: TransitionableOrderStatus[] = [
  "FAILED",
  "RETURNED",
  "REFUNDED",
]

export default function OrderDetailsActions({
  orderId,
  status,
  invoiceNumber,
  invoicePdfUrl,
}: OrderDetailsActionsProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [pendingTransition, setPendingTransition] =
    useState<TransitionableOrderStatus | null>(null)

  const { mutate: transition, isPending: isTransitioning } = useMutation({
    mutationFn: transitionAdminOrderStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orderQueryKeys.all })
    },
  })

  const invalidateAfterInvoiceMutation = async () => {
    await queryClient.invalidateQueries({
      queryKey: orderQueryKeys.detail(orderId),
    })
    await queryClient.invalidateQueries({
      queryKey: invoiceQueryKeys.all,
    })
  }

  const { mutate: generateMutation, isPending: isGenerating } = useMutation({
    mutationFn: () => generateInvoice(orderId),
    onSuccess: invalidateAfterInvoiceMutation,
  })

  const { mutate: regenerateMutation, isPending: isRegenerating } = useMutation(
    {
      mutationFn: () => regenerateInvoice(orderId),
      onSuccess: invalidateAfterInvoiceMutation,
    }
  )

  const isInvoiceWorking = isGenerating || isRegenerating
  const hasInvoice = Boolean(invoiceNumber)

  if (!status) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="button" size="md" variant="outline" disabled>
          جاري التحميل...
        </Button>
      </div>
    )
  }

  const allowedTransitions = ALLOWED_ORDER_TRANSITIONS[status] ?? []
  const canCancel = CANCELLABLE_STATUSES.includes(status)
  const canEdit = EDITABLE_STATUSES.includes(status)
  const canRefund = REFUNDABLE_STATUSES.includes(status)

  const runTransition = (target: TransitionableOrderStatus) => {
    transition(
      initOrderTransition(orderId, {
        targetStatus: target,
      })
    )
  }

  const handleTransitionClick = (target: TransitionableOrderStatus) => {
    if (DESTRUCTIVE_TRANSITIONS.includes(target)) {
      setPendingTransition(target)
      return
    }

    runTransition(target)
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {canRefund ? (
          <Button
            type="button"
            size="md"
            variant="outline"
            onClick={() => router.push(`/orders/${orderId}/returns`)}
          >
            بدء استرداد
            <Receipt data-icon="inline-end" />
          </Button>
        ) : null}

        {canEdit ? (
          <Button
            type="button"
            size="md"
            variant="outline"
            onClick={() => router.push(`/orders/${orderId}/edit`)}
          >
            تعديل الطلب
            <PenLine data-icon="inline-end" />
          </Button>
        ) : null}

        {hasInvoice && invoicePdfUrl ? (
          <>
            <Button type="button" size="md" variant="outline" asChild>
              <a href={invoicePdfUrl} target="_blank" rel="noopener noreferrer">
                تنزيل الفاتورة
                <Download data-icon="inline-end" />
              </a>
            </Button>

            <Button
              type="button"
              size="md"
              variant="outline"
              onClick={() => regenerateMutation()}
              disabled={isInvoiceWorking}
            >
              إعادة توليد
              <RefreshCcw data-icon="inline-end" />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="md"
            variant="outline"
            onClick={() => generateMutation()}
            disabled={isInvoiceWorking}
          >
            توليد فاتورة
            <FileText data-icon="inline-end" />
          </Button>
        )}

        {allowedTransitions.map((target) => {
          const Icon = TRANSITION_ICONS[target]
          const isDestructive = DESTRUCTIVE_TRANSITIONS.includes(target)

          return (
            <Button
              key={target}
              type="button"
              size="md"
              variant={isDestructive ? "outline" : "secondary"}
              onClick={() => handleTransitionClick(target)}
              disabled={isTransitioning}
            >
              {ORDER_TRANSITION_ACTION_LABELS[target]}
              <Icon data-icon="inline-end" />
            </Button>
          )
        })}

        {canCancel ? (
          <Button
            type="button"
            size="md"
            variant="destructive"
            onClick={() => router.push(`/orders/${orderId}/cancel`)}
          >
            إلغاء الطلب
            <XCircle data-icon="inline-end" />
          </Button>
        ) : null}
      </div>

      <ConfirmAlert
        open={pendingTransition !== null}
        onOpenChange={(open) => {
          if (!open) setPendingTransition(null)
        }}
        title={
          pendingTransition
            ? ORDER_TRANSITION_ACTION_LABELS[pendingTransition]
            : ""
        }
        description="هذا الإجراء يُعدّل حالة الطلب ولا يمكن التراجع عنه. هل تريد المتابعة؟"
        actionLabel="تأكيد"
        variant="destructive"
        onAction={() => {
          if (pendingTransition) {
            runTransition(pendingTransition)
          }
        }}
      />
    </>
  )
}
