import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  ArrowUpRight,
  BarChart3,
  LineChart,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react"

const WEEK_BAR_HEIGHTS = [42, 68, 55, 80, 62, 90, 74]

function MockSalesLineChart() {
  const points = [
    [0, 32],
    [16, 22],
    [32, 28],
    [48, 12],
    [64, 18],
    [80, 8],
    [100, 14],
  ]
  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ")
  return (
    <div className="relative h-44 w-full">
      <svg
        className="h-full w-full overflow-visible text-primary"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="homeLineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${d} L 100 40 L 0 40 Z`}
          fill="url(#homeLineFill)"
          className="text-primary"
        />
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>س</span>
        <span>ح</span>
        <span>ن</span>
        <span>ث</span>
        <span>ر</span>
        <span>خ</span>
        <span>ج</span>
      </div>
    </div>
  )
}

function MockBarChart() {
  return (
    <div className="flex h-44 items-end justify-between gap-1.5 px-1 pt-4">
      {WEEK_BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="bg-primary/70 hover:bg-primary/90 min-w-0 flex-1 rounded-t-md transition-colors"
          style={{ height: `${h}%` }}
          title={`يوم ${i + 1}`}
        />
      ))}
    </div>
  )
}

const statCards = [
  {
    title: "إجمالي المبيعات",
    subtitle: "هذا الشهر (تجريبي)",
    value: "١٢٤٬٥٠٠",
    delta: "+١٢٪",
    icon: ShoppingCart,
  },
  {
    title: "الطلبات",
    subtitle: "آخر ٣٠ يومًا",
    value: "٣٤٢",
    delta: "+٨٪",
    icon: Package,
  },
  {
    title: "العملاء",
    subtitle: "نشطون",
    value: "١٬٢٠٨",
    delta: "+٣٪",
    icon: Users,
  },
  {
    title: "معدل التحويل",
    subtitle: "زيارات → شراء",
    value: "٣٫٢٪",
    delta: "+٠٫٤٪",
    icon: ArrowUpRight,
  },
] as const

export function HomeMockDashboard() {
  return (
    <div className="space-y-8 pb-10">
      <header className="space-y-2">
        <h1 className="page-title mb-0">الرئيسية</h1>
        <p className="text-muted-foreground max-w-2xl text-base">
          لوحة تجريبية لعرض شكل الصفحة. سيتم استبدال هذه البيانات بإحصاءات حقيقية
          لاحقًا.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-text font-heading text-xl font-semibold">
          ملخص سريع
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item) => (
            <Card key={item.title} size="sm">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.subtitle}</CardDescription>
                </div>
                <item.icon
                  className="text-primary mt-0.5 size-5 shrink-0 opacity-80"
                  aria-hidden
                />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-text font-heading text-2xl font-bold tabular-nums">
                    {item.value}
                  </span>
                  <span className="text-secondary text-sm font-medium tabular-nums">
                    {item.delta}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-text font-heading text-xl font-semibold">
          الرسوم البيانية
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <LineChart className="text-primary size-5" aria-hidden />
                <div>
                  <CardTitle className="text-lg">اتجاه المبيعات</CardTitle>
                  <CardDescription>بيانات أسبوعية وهمية</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MockSalesLineChart />
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="text-primary size-5" aria-hidden />
                <div>
                  <CardTitle className="text-lg">حجم الطلبات</CardTitle>
                  <CardDescription>مقارنة أيام الأسبوع (وهمي)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MockBarChart />
              <div className="text-muted-foreground mt-2 flex justify-between text-xs">
                <span>أ</span>
                <span>ث</span>
                <span>ر</span>
                <span>خ</span>
                <span>ج</span>
                <span>س</span>
                <span>ح</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-text font-heading text-xl font-semibold">
          نشاط حديث
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "طلب جديد",
              body: "عميل أضاف منتجًا إلى السلة — بانتظار الدفع.",
            },
            {
              title: "تعليق",
              body: "مراجعة جديدة على أحد المنتجات (محتوى تجريبي).",
            },
            {
              title: "مخزون",
              body: "تنبيه وهمي: كمية منخفضة لصنف تجريبي.",
            },
          ].map((note) => (
            <Card key={note.title} size="sm">
              <CardHeader>
                <CardTitle className="text-lg">{note.title}</CardTitle>
                <CardDescription>{note.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
