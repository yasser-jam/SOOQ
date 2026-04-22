"use client"

import Link from "next/link"
import { useState } from "react"
import { AlertTriangle, CheckCheck, ChevronLeft } from "lucide-react"

import type { AdminOrderItem } from "@/modules/order/order/types"
import { OrderLineItemRow } from "@/modules/order/order/components/order-summary-card"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Separator } from "@workspace/ui/components/separator"

interface OrderReturnsPageViewProps {
  orderId: string
}

const RETURN_ITEM: AdminOrderItem = {
  id: "return-item-1",
  title: "الطلب",
  sku: "WR-990-BLK",
  quantity: 1,
  priceLabel: "125,000 ل س",
  inventoryLabel: "تالف",
  thumbnailUrl: null,
}

export default function OrderReturnsPageView({
  orderId,
}: OrderReturnsPageViewProps) {
  const [isActive, setIsActive] = useState(true)

  return (
    <div className="container my-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">الاسترداد والإرجاع</h1>

        <Button variant="ghost" size="md">
          <Link className="flex items-center gap-2" href={`/orders/${orderId}`}>
            العودة لتفاصيل الطلب
            <ChevronLeft data-icon="inline-start" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="gap-4 py-6">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl">بيانات طلب الاسترداد</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            <div>
              <p className="text-text text-sm font-medium">مبلغ الاسترداد</p>
              <Input value="المبلغ" readOnly />
            </div>

            <div className="grid grid-cols-2 gap-5 md:grid-cols-2">
              <div>
                <p className="text-text text-sm font-medium">سبب الاسترداد</p>
                <Input value="منتج تالف" readOnly />
              </div>

              <div>
                <p className="text-text text-sm font-medium">إجراءات المخزون</p>
                <label className="flex h-12 items-center gap-3 rounded-md border border-input bg-white px-4 justify-between">
                  <span className="text-sm">إرجاع للمخزون</span>

                  <button
                    id="isActive"
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    onClick={() => setIsActive((prev) => !prev)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      isActive ? "bg-secondary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block size-5 rounded-full bg-white transition-transform ${
                        isActive ? "-translate-x-1" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>

            <OrderLineItemRow item={RETURN_ITEM} isLoading={false} />

            <Alert
              variant="destructive"
              className="rounded-2xl border-destructive/50 bg-destructive/5 px-5 py-4 text-lg"
            >
              <AlertTriangle className="my-auto me-4 size-6" />
              <AlertDescription className="text-base leading-relaxed text-destructive">
                هذا الإجراء غير قابل للتراجع وسيتم إخطار العميل فوراً عبر
                الرسائل النصية والبريد الإلكتروني.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="gap-4 py-6">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl">ملخص العملية</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-base rounded-xl border border-border bg-primary/5 px-4 py-3">
              <span className="text-text">إجمالي الطلب الحالي</span>
              <span className="text-text font-semibold">3,602,500 ل.س</span>
            </div>

            <div className="flex items-center justify-between text-base rounded-xl border border-border bg-primary/5 px-4 py-3">
              <span className="text-text">مبلغ الاسترداد</span>
              <span className="text-destructive font-semibold">-125,000 ل.س</span>
            </div>

            <div className="flex items-center justify-between text-base rounded-xl border border-border bg-primary/5 px-4 py-3">
              <span className="text-text">رسوم الخدمة (مستردة)</span>
              <span className="text-text font-semibold">0 ل.س</span>
            </div>

            <Separator className="my-2" />

            <div className="flex items-center justify-between text-base rounded-xl border border-border bg-muted/50 px-4 py-3">
              <span className="text-text">الرصيد النهائي</span>
              <span className="text-text font-semibold">0 ل.س</span>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <Button size="md" variant="outline">
                رجوع
              </Button>
              <Button size="md" variant="secondary">
                تأكيد الاسترداد
                <CheckCheck data-icon="inline-end" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
