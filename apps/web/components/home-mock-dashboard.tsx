import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  AlertTriangle,
  Check,
  MessageSquare,
  PackagePlus,
  PackageSearch,
  Palette,
  Ticket,
} from "lucide-react"

const today = new Date().toLocaleDateString("ar-SA", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
})

const stats = [
  { label: "إجمالي العملاء", value: "١٬٢٤٨", icon: "👥", delta: "+١٢٪", up: true },
  { label: "إجمالي الطلبات", value: "٣٬٥٠٦", icon: "🧾", delta: "+٨٪", up: true },
  { label: "إجمالي الإيرادات", value: "١٨٤٬٩٠٠ ل.س", icon: "💰", delta: "+٢١٪", up: true },
  { label: "إجمالي المنتجات", value: "٣١٢", icon: "📦", delta: "٠٪", up: false },
] as const

type Step = {
  title: string
  desc: string
  done: boolean
  next?: boolean
  cta?: string
  ctaVariant?: "primary" | "outline"
  ctaHref?: string
}

const steps: Step[] = [
  { title: "إنشاء المتجر", desc: "تم إعداد متجرك واختيار الثيم.", done: true },
  { title: "إضافة أول منتج", desc: "أضفت 312 منتجًا إلى الكتالوج.", done: true },
  {
    title: "إنشاء تطبيق الجوال",
    desc: "أنشئ تطبيقًا يعكس ثيم متجرك تلقائيًا.",
    done: false,
    next: true,
    cta: "ابدأ الآن",
    ctaVariant: "primary",
    ctaHref: "/design-studio",
  },
  {
    title: "استلام أول طلب",
    desc: "شارك رابط متجرك لتصل أول عملية شراء.",
    done: false,
    cta: "مشاركة الرابط",
    ctaVariant: "outline",
  },
]

const completedSteps = steps.filter((step) => step.done).length
const progressPercent = Math.round((completedSteps / steps.length) * 100)

const quickActions = [
  { icon: PackagePlus, label: "إضافة منتج" },
  { icon: PackageSearch, label: "تعديل المخزون" },
  { icon: Ticket, label: "كود خصم" },
  { icon: Palette, label: "تعديل الثيم" },
] as const

const alerts = [
  { text: "طلبات بانتظار المعالجة", count: "٦", icon: AlertTriangle, tone: "text-secondary" },
  { text: "منتجات قاربت على النفاد", count: "٣", icon: PackageSearch, tone: "text-destructive" },
  { text: "تقييمات جديدة بحاجة لرد", count: "٢", icon: MessageSquare, tone: "text-primary" },
] as const

type OrderStatus = "جديد" | "قيد التجهيز" | "تم التسليم" | "ملغي"

const orderStatusVariant: Record<
  OrderStatus,
  "primary" | "secondary-tonal" | "default" | "destructive"
> = {
  "جديد": "primary",
  "قيد التجهيز": "secondary-tonal",
  "تم التسليم": "default",
  "ملغي": "destructive",
}

const orders: { id: string; customer: string; total: string; status: OrderStatus }[] = [
  { id: "#١٠٤٨٢", customer: "سارة العتيبي", total: "٦٢٠ ل.س", status: "جديد" },
  { id: "#١٠٤٨١", customer: "محمد الحربي", total: "١٬١٤٠ ل.س", status: "قيد التجهيز" },
  { id: "#١٠٤٨٠", customer: "نورة القحطاني", total: "٢٨٥ ل.س", status: "تم التسليم" },
  { id: "#١٠٤٧٩", customer: "عبدالله الشمري", total: "٨٩٠ ل.س", status: "ملغي" },
]

export function HomeMockDashboard({ storeName }: { storeName?: string | null }) {
  return (
    <div className="space-y-8 pb-10">
      {/* greeting */}
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-muted-foreground mb-1.5 text-sm">{today}</p>
          <h1 className="page-title mb-2.5">
            أهلاً بك{storeName ? `، ${storeName}` : ""} 👋
          </h1>
          <p className="text-muted-foreground max-w-xl text-[15px] leading-7">
            هذه نظرة سريعة على متجرك اليوم. أكمل خطوات التهيئة لتبدأ البيع بشكل
            كامل.
          </p>
        </div>
        <div className="border-border bg-card flex items-center gap-2.5 rounded-xl border px-4.5 py-3">
          <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold">المتجر يعمل</span>
          <span className="text-muted-foreground text-xs">·</span>
          <Button variant="link" size="sm" className="h-auto p-0 text-[13.5px]">
            زيارة المتجر
          </Button>
        </div>
      </header>

      {/* stats */}
      <section className="space-y-3">
        <h2 className="text-text font-heading text-xl font-semibold">
          ملخص سريع
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.label} size="sm" className="gap-3">
              <CardHeader className="flex-row items-center justify-between p-0">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {item.label}
                </CardTitle>
                <span className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg text-base">
                  {item.icon}
                </span>
              </CardHeader>
              <CardContent className="space-y-1.5 p-0">
                <div className="font-heading text-[26px] leading-8 font-bold tabular-nums">
                  {item.value}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      item.up ? "text-emerald-600" : "text-muted-foreground"
                    }`}
                  >
                    {item.delta}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    مقارنة بالشهر الماضي
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* onboarding + quick actions */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card size="sm" className="gap-5.5">
          <CardHeader className="flex-row flex-wrap items-start justify-between gap-4 p-0">
            <div>
              <CardTitle className="mb-1.5 text-lg">
                خطوات تهيئة متجرك
              </CardTitle>
              <CardDescription>
                أنجزت خطوتين من أربع. تبقّت خطوتان فقط.
              </CardDescription>
            </div>
            <div className="flex min-w-[120px] flex-col items-end gap-2">
              <span className="text-secondary text-xl font-bold">
                {progressPercent}٪
              </span>
              <div className="bg-muted h-1.5 w-30 overflow-hidden rounded-full">
                <div
                  className="bg-secondary h-full rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 p-0">
            {steps.map((step) => (
              <div
                key={step.title}
                className={`flex items-center gap-3.5 rounded-2xl border p-4 ${
                  step.done
                    ? "border-emerald-200 bg-emerald-50"
                    : step.next
                      ? "border-secondary/60 border-2 bg-secondary/5"
                      : "border-border bg-muted/30"
                }`}
              >
                <span
                  className={`flex size-6.5 shrink-0 items-center justify-center rounded-full ${
                    step.done
                      ? "bg-emerald-500 text-white"
                      : "border-muted-foreground/40 border-2 border-dashed"
                  }`}
                >
                  {step.done && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p
                    className={`text-sm font-bold ${
                      step.done ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-muted-foreground text-[13px] leading-6">
                    {step.desc}
                  </p>
                </div>
                {step.cta && (
                  <Button
                    size="sm"
                    variant={step.ctaVariant === "primary" ? "secondary" : "outline"}
                    className="shrink-0"
                    asChild={Boolean(step.ctaHref)}
                  >
                    {step.ctaHref ? (
                      <Link href={step.ctaHref}>{step.cta}</Link>
                    ) : (
                      step.cta
                    )}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card size="sm" className="gap-4.5">
            <CardHeader className="p-0">
              <CardTitle className="mb-1.5 text-lg">إجراءات سريعة</CardTitle>
              <CardDescription>
                المهام الأكثر استخدامًا في متناول يدك.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 p-0">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="border-border bg-muted/30 hover:bg-muted flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-start transition-colors"
                >
                  <action.icon className="text-secondary size-5" />
                  <span className="text-[14.5px] font-bold">{action.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card size="sm" className="gap-3">
            <CardHeader className="flex-row items-center justify-between p-0">
              <CardTitle className="text-lg">يحتاج انتباهك</CardTitle>
              <Button variant="link" size="sm" className="h-auto p-0 text-[13.5px]">
                عرض الكل
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {alerts.map((alert) => (
                <div
                  key={alert.text}
                  className="border-border/70 flex items-center gap-3 border-t py-3 first:border-t-0"
                >
                  <alert.icon className={`size-4 shrink-0 ${alert.tone}`} />
                  <span className="flex-1 text-sm">{alert.text}</span>
                  <span className="text-muted-foreground text-sm font-bold">
                    {alert.count}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* recent orders */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-text font-heading text-xl font-semibold">
              أحدث الطلبات
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              آخر {orders.length} طلبات وردت إلى متجرك.
            </p>
          </div>
          <Button variant="link" size="sm" className="h-auto p-0 text-sm">
            كل الطلبات
          </Button>
        </div>

        <Card size="sm" className="overflow-hidden p-0">
          <div className="bg-muted/40 text-muted-foreground grid grid-cols-4 gap-3 px-6 py-3 text-xs font-bold">
            <span>رقم الطلب</span>
            <span>العميل</span>
            <span>المبلغ</span>
            <span>الحالة</span>
          </div>
          <div>
            {orders.map((order) => (
              <div
                key={order.id}
                className="border-border/70 hover:bg-muted/30 grid grid-cols-4 items-center gap-3 border-t px-6 py-4 text-[14.5px] transition-colors"
              >
                <span dir="ltr" className="inline-block text-start font-bold">
                  {order.id}
                </span>
                <span>{order.customer}</span>
                <span className="font-bold">{order.total}</span>
                <span>
                  <Badge variant={orderStatusVariant[order.status]}>
                    {order.status}
                  </Badge>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}
