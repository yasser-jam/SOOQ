import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { PageHeader } from "@/components/system/PageHeader"

export default function AccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="حسابي" description="إعدادات حساب مدير المنصة" />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الجلسات</CardTitle>
            <CardDescription>عرض وإنهاء الجلسات النشطة</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/account/sessions">إدارة الجلسات</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الأمان</CardTitle>
            <CardDescription>المصادقة الثنائية TOTP</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/account/security">إعدادات الأمان</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">رقم الهاتف</CardTitle>
            <CardDescription>تغيير رقم تسجيل الدخول</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/account/phone">تغيير الرقم</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
