"use client"

import { useMemo, useState } from "react"
import { CircleCheck, QrCode, Smartphone, Truck } from "lucide-react"

import PageDialog from "@/components/system/page-dialog"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

interface OrderEditDialogProps {
  orderId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ShippingPartner = "SELF_MANAGED" | "DRIVER_APP"

const SHIPPING_STAGES = ["تأكيد الطلب", "جاري المعالجة", "تم الشحن"] as const

export default function OrderEditDialog({
  orderId,
  open,
  onOpenChange,
}: OrderEditDialogProps) {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [shippingPartner, setShippingPartner] =
    useState<ShippingPartner>("DRIVER_APP")
  const [notes, setNotes] = useState("")

  const subtitle = useMemo(
    () => `رقم الطلب: ${orderId} • الرجاء الانتقال إلى مرحلة الشحن`,
    [orderId]
  )

  const handleCancel = () => {
    onOpenChange(false)
  }

  const handleConfirmShipping = () => {
    onOpenChange(false)
  }

  return (
    <PageDialog
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title="تغيير حالة الطلب"
      description={subtitle}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleCancel}
          >
            إلغاء
          </Button>

          <Button
            type="button"
            size="md"
            variant="secondary"
            onClick={handleConfirmShipping}
          >
            تأكيد الشحنة
            <CircleCheck data-icon="inline-end" />
          </Button>
        </>
      }
    >
      <div className="grid gap-6">
        <div className="grid grid-cols-3 items-start gap-4">
          {SHIPPING_STAGES.map((stage, index) => {
            const isCurrent = index === SHIPPING_STAGES.length - 1

            return (
              <div
                key={stage}
                className="relative flex flex-col items-center gap-2"
              >
                {index < SHIPPING_STAGES.length - 1 ? (
                  <span className="absolute start-1/2 top-5 z-0 h-px w-full bg-border" />
                ) : null}

                <span
                  className={cn(
                    "z-10 flex size-10 items-center justify-center rounded-xl border bg-background",
                    isCurrent
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  <Truck className="size-4" />
                </span>

                <p
                  className={cn(
                    "text-center text-xs sm:text-sm",
                    isCurrent
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {stage}
                </p>
              </div>
            )
          })}
        </div>

        <Field>
          <FieldLabel htmlFor="trackingNumber">رقم التتبع</FieldLabel>
          <div className="relative">
            <Input
              id="trackingNumber"
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder="e.g. SY-99283-DX"
              className="h-11 ps-10"
            />
            <QrCode className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </Field>

        <Field>
          <FieldLabel>شريك التسليم</FieldLabel>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              type="button"
              size="md"
              variant={
                shippingPartner === "SELF_MANAGED" ? "secondary" : "outline"
              }
              className="h-14"
              onClick={() => setShippingPartner("SELF_MANAGED")}
            >
              <Smartphone data-icon="inline-end" />
              توصيل ذاتي (خارج نطاق التطبيق)
            </Button>

            <Button
              type="button"
              size="md"
              variant={
                shippingPartner === "DRIVER_APP" ? "secondary" : "outline"
              }
              className="h-14"
              onClick={() => setShippingPartner("DRIVER_APP")}
            >
              <Truck data-icon="inline-end" />
              تطبيق السائقين
            </Button>
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="customerNote">
            ملاحظة للعميل (اختياري)
          </FieldLabel>
          <Textarea
            id="customerNote"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="أضف لمسة شخصية أو تعليمات تسليم محددة..."
            className="min-h-24"
          />
        </Field>
      </div>
    </PageDialog>
  )
}
