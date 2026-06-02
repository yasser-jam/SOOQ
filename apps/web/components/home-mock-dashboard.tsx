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
  ChevronLeft,
  LineChart,
  MoreHorizontal,
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

const statCardStyles = [
  {
    accent: "text-[#d8752a]",
    border: "border-[#d7b59d]",
    shadow: "shadow-[0_2px_5px_rgba(126,85,53,0.22)]",
  },
  {
    accent: "text-[#116f6a]",
    border: "border-[#8dbfba]",
    shadow: "shadow-[0_2px_5px_rgba(35,104,99,0.22)]",
  },
  {
    accent: "text-[#102f30]",
    border: "border-[#9bbab7]",
    shadow: "shadow-[0_2px_5px_rgba(36,78,78,0.2)]",
  },
  {
    accent: "text-[#102f30]",
    border: "border-[#a8bebb]",
    shadow: "shadow-[0_2px_5px_rgba(36,78,78,0.18)]",
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item, index) => {
            const style = statCardStyles[index % statCardStyles.length]!

            return (
              <Card
                key={item.title}
                size="sm"
                className={`relative min-h-[90px] justify-between gap-1 rounded-[10px] border bg-[#f7fbfa] px-4 py-3 ${style.border} ${style.shadow}`}
              >
                <CardHeader className="p-0">
                  <CardTitle className="text-right text-xs font-medium leading-5 text-[#233b3c]">
                    {item.title}
                  </CardTitle>
                  <MoreHorizontal
                    className="absolute left-4 top-3 size-5 text-[#07857c]"
                    aria-hidden
                  />
                </CardHeader>
                <CardContent className="p-0 text-right">
                  <span
                    className={`absolute bottom-3 left-4 text-xs font-medium tabular-nums ${style.accent}`}
                  >
                    {item.delta}
                  </span>
                  <div
                    className={`font-heading text-[22px] font-bold leading-7 tabular-nums ${style.accent}`}
                  >
                    {item.value}
                  </div>
                  <CardDescription className="mt-0.5 text-xs text-[#233b3c]">
                    {item.subtitle}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-text font-heading text-xl font-semibold">
          الرسوم البيانية
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card
            size="sm"
            className="rounded-[10px] border border-[#a8c6c2] bg-[#f4fbfa] px-3 py-3 shadow-[0_2px_5px_rgba(36,78,78,0.18)]"
          >
            <CardHeader className="p-0">
              <div className="flex items-start justify-between gap-3" dir="ltr">
                <ChevronLeft className="mt-1 size-4 shrink-0 text-[#116f6a]" aria-hidden />
                <div className="flex items-start gap-2 text-right" dir="rtl">
                <LineChart className="mt-0.5 size-4 shrink-0 text-[#116f6a]" aria-hidden />
                  <div className="space-y-2.5">
                  <CardTitle className="text-lg">اتجاه المبيعات</CardTitle>
                  <CardDescription>بيانات أسبوعية وهمية</CardDescription>
                </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-4 rounded-[8px] border border-[#c8ddda] bg-[#f8fdfc] px-3 py-2">
              <MockSalesLineChart />
            </CardContent>
          </Card>

          <Card
            size="sm"
            className="rounded-[10px] border border-[#a8c6c2] bg-[#f4fbfa] px-3 py-3 shadow-[0_2px_5px_rgba(36,78,78,0.18)]"
          >
            <CardHeader className="p-0">
              <div className="flex items-start justify-between gap-3" dir="ltr">
                <ChevronLeft className="mt-1 size-4 shrink-0 text-[#116f6a]" aria-hidden />
                <div className="flex items-start gap-2 text-right" dir="rtl">
                <BarChart3 className="mt-0.5 size-4 shrink-0 text-[#116f6a]" aria-hidden />
                  <div className="space-y-2.5">
                  <CardTitle className="text-lg">حجم الطلبات</CardTitle>
                  <CardDescription>مقارنة أيام الأسبوع (وهمي)</CardDescription>
                </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-4 rounded-[8px] border border-[#c8ddda] bg-[#f8fdfc] px-3 py-2">
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
