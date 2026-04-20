import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function OrdersPageView() {
  return (
    <div className="container my-6 flex flex-col gap-6">
      <div className="page-title">الطلبات</div>

      <Card className="py-6">
        <CardHeader>
          <CardTitle className="text-xl">قائمة الطلبات</CardTitle>
          <CardDescription>
            تم تجهيز صفحة التفاصيل بشكل كامل. يمكنك ربطها بجدول الطلبات لاحقا.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              المسار الحالي للتفاصيل: /orders/[order_id]
            </p>

            <Button size="md" variant="secondary">
              <Link href="/orders/preview-order">فتح نموذج صفحة الطلب</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  )
}
