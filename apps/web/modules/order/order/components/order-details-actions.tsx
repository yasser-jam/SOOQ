"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  CircleCheck,
  Cog,
  Download,
  FileText,
  PackageCheck,
  PackagePlus,
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
import CreateShipmentDialog from "@/modules/shipping/shipment/components/create-shipment-dialog"
import {
  fetchPublicShipmentTracking,
  publicShipmentTrackingQueryKey,
} from "@/modules/shipping/shipment/public-tracking"
import { Button } from "@workspace/ui/components/button"

import type { PaymentMethod } from "@/lib/domain-enums"

interface OrderDetailsActionsProps {
  orderId: string
  status?: OrderStatus
  invoiceNumber?: string | null
  invoicePdfUrl?: string | null
  orderNumber?: string | null
  paymentMethod?: PaymentMethod | null
  orderTotal?: number | null
  destinationLat?: number | null
  destinationLng?: number | null
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
  orderNumber,
  paymentMethod,
  orderTotal,
  destinationLat,
  destinationLng,
}: OrderDetailsActionsProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [pendingTransition, setPendingTransition] =
    useState<TransitionableOrderStatus | null>(null)
  const [shipmentDialogOpen, setShipmentDialogOpen] = useState(false)

  const { mutate: transition, isPending: isTransitioning } = useMutation({
    mutationFn: transitionAdminOrderStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orderQueryKeys.all })
    },
  })

  // Shared with OrderShipmentTrackingCard via the same queryKey — React Query
  // dedupes the network call. We only need to know whether a shipment exists
  // (to decide whether to show the "Create Shipment" button).
  const { data: tracking } = useQuery({
    queryKey: publicShipmentTrackingQueryKey(orderId),
    queryFn: () => fetchPublicShipmentTracking(orderId),
    retry: false,
    enabled: Boolean(orderId),
  })
  const hasShipment = Boolean(tracking?.shipmentId)

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
  // Refund is only meaningful for online-paid orders. COD orders settle through
  // the COD reconciliation flow, not the refund endpoint (which 422s on COD).
  const canRefund = REFUNDABLE_STATUSES.includes(status) && paymentMethod !== "COD"

  // Manual create-shipment button — replaces the previous auto-open on the
  // PROCESSING transition. Visible only when a shipment can still be created
  // (terminal/cancelled orders are out) and one doesn't already exist.
  const SHIPPABLE_STATUSES: OrderStatus[] = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
  ]
  const canCreateShipment =
    !hasShipment &&
    SHIPPABLE_STATUSES.includes(status) &&
    typeof destinationLat === "number" &&
    typeof destinationLng === "number"

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

        {canCreateShipment ? (
          <Button
            type="button"
            size="md"
            variant="secondary"
            onClick={() => setShipmentDialogOpen(true)}
          >
            إنشاء شحنة
            <PackagePlus data-icon="inline-end" />
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

      <CreateShipmentDialog
        open={shipmentDialogOpen}
        onOpenChange={setShipmentDialogOpen}
        orderId={orderId}
        orderNumber={orderNumber}
        paymentMethod={paymentMethod}
        orderTotal={orderTotal}
        destinationLat={destinationLat}
        destinationLng={destinationLng}
      />
    </>
  )
}
