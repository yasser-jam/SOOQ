import { CreditCard, Wallet } from "lucide-react"

import { PAYMENT_STATUS_META, PAYMENT_METHOD_LABELS } from "@/lib/domain-enums"
import { formatSyp } from "@/lib/money"
import type { AdminOrder } from "@/modules/order/order/types"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

interface OrderPaymentCardProps {
  order?: AdminOrder
  isLoading?: boolean
}

export default function OrderPaymentCard({
  order,
  isLoading = false,
}: OrderPaymentCardProps) {
  const paymentMethod = order?.paymentMethod
  const paymentStatus = order?.paymentStatus
  const paymentStatusMeta = paymentStatus
    ? PAYMENT_STATUS_META[paymentStatus]
    : undefined
  const paymentMethodLabel = paymentMethod
    ? PAYMENT_METHOD_LABELS[paymentMethod]
    : undefined
  const paymeraTxnId = order?.paymeraTxnId
  const total = order?.pricing?.total
  const Icon = paymentMethod === "PAYMERA" ? CreditCard : Wallet

  return (
    <Card className="h-full gap-4 rounded-3xl py-6">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl">معلومات الدفع</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon />
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <span className="text-sm text-muted-foreground">طريقة الدفع</span>
            {isLoading ? (
              <Skeleton className="h-5 w-32" />
            ) : (
              <span className="text-base font-semibold text-foreground">
                {paymentMethodLabel ?? "غير محدد"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">حالة الدفع</span>
          {isLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : paymentStatusMeta ? (
            <Badge variant={paymentStatusMeta.badgeVariant}>
              {paymentStatusMeta.label}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">المبلغ الإجمالي</span>
          {isLoading ? (
            <Skeleton className="h-6 w-28" />
          ) : (
            <span className="font-semibold text-foreground">
              {typeof total === "number" ? formatSyp(total) : "—"}
            </span>
          )}
        </div>

        {paymeraTxnId ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">رقم العملية</span>
            <span className="font-mono text-sm text-foreground" dir="ltr">
              {paymeraTxnId}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
