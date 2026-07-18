"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowUpRight,
  Check,
  ExternalLink,
  Globe,
  Link2Icon,
  Monitor,
  Palette,
  Pencil,
  Plus,
  Smartphone,
  Sparkles,
  Upload,
  Eye,
  Download,
  RefreshCw,
  Settings,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { useStorePath } from "@/lib/store-path"
import { getStoreSettingsQueryOptions } from "@/modules/store/settings/actions"

import ThemeMarketplaceCard from "./_components/theme-marketplace-card"
import { ThemeOnboardingDialog } from "./_components/theme-onboarding-dialog"
import { themeCatalog } from "@/modules/design-studio/store-theme"
import {
  buildStudioMobileEditHref,
  themeNameToStudioSegment,
} from "@/lib/design-studio-paths"
import { useSelectedStoreTheme } from "@/modules/design-studio/use-selected-store-theme"

export default function DesignStudioPage() {
  const storePath = useStorePath()
  const { data: settings, isPending } = useQuery(getStoreSettingsQueryOptions())
  const { selectedTheme, selectTheme, isReady } = useSelectedStoreTheme()
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  const editorBase = storePath("/design-studio")
  const themeSegment = selectedTheme
    ? themeNameToStudioSegment(selectedTheme.name)
    : "theme-1"
  const themeEditHref = `${editorBase}/${themeSegment}/edit`
  const themeMobileEditHref = buildStudioMobileEditHref(
    editorBase,
    selectedTheme?.name ?? "Theme 1"
  )
  const themesGalleryHref = themeEditHref

  const storeSlug = settings?.slug ?? ""
  const shopUrl = useMemo(() => {
    if (!storeSlug) return ""
    if (typeof window === "undefined") return `/shop/${storeSlug}`
    return `${window.location.origin}/shop/${storeSlug}`
  }, [storeSlug])

  // TODO: Wire these to real stage flags from backend/localStorage
  const hasCompletedConfig = true
  const hasSelectedTheme = isReady && !!selectedTheme
  const hasMobileApp = false
  const mobileInstalls = 0


  return (
    <div className="container space-y-8 py-8">
      {/* Page header */}
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          استوديو التصميم
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="page-title">مصنع الثيمات</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              خصّص مظهر متجرك، راقب حالة الموقع، وعدّل الثيم الحالي من مكان
              واحد.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setOnboardingOpen(true)}>
            <Plus data-icon="inline-start" className="size-4" />
            إنشاء ثيم مخصص
          </Button>
        </div>
      </header>

      {/* Stage 1: Store configuration not done */}
      {!hasCompletedConfig && <StoreConfigCta storePath={storePath} />}

      {/* Stage 2: No theme selected */}
      {hasCompletedConfig && !hasSelectedTheme && <NoThemeCta />}

      {/* Stage 3: Active theme hero */}
      {hasSelectedTheme && selectedTheme && (
        <ActiveThemeCard
          theme={selectedTheme}
          themeEditHref={themeEditHref}
          themeMobileEditHref={themeMobileEditHref}
          storePath={storePath}
        />
      )}

      {/* Store URL bar */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-5 py-3">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="size-4" />
          رابط المتجر
        </span>
        {isPending ? (
          <Skeleton className="h-4 w-48" />
        ) : shopUrl ? (
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            dir="ltr"
          >
            {shopUrl.replace(/^https?:\/\//, "")}
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">
            أكمل إعداد المتجر لعرض الرابط العام.
          </span>
        )}
      </div>

      {/* Theme marketplace */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-text text-xl font-semibold">قوالب الثيمات</h2>
            <p className="text-sm text-muted-foreground">
              استكشف اتجاهات بصرية جاهزة أو طبّق ثيماً جديداً على متجرك.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={themesGalleryHref}>
              استكشف المزيد
              <Sparkles data-icon="inline-end" className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {themeCatalog.map((theme) => (
            <ThemeMarketplaceCard
              key={theme.id}
              title={theme.name}
              description={theme.description}
              previewImage={theme.image}
              isActive={selectedTheme?.id === theme.id}
              onSelect={() => selectTheme(theme.id)}
            />
          ))}
        </div>
      </section>

      {/* Mobile app section */}
      {hasMobileApp ? (
        <MobileAppStats installs={mobileInstalls} />
      ) : (
        <MobileAppCta />
      )}

      {/* Onboarding dialog */}
      <ThemeOnboardingDialog
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
      />
    </div>
  )
}

// ─── Stage 1: Config CTA ─────────────────────────────────────────────────────

function StoreConfigCta({ storePath }: { storePath: (p: string) => string }) {
  return (
    <Card className="border border-border/60">
      <CardContent className="py-6">
        <div className="grid grid-cols-[1fr_auto] items-center gap-6">
          <div>
            <CardTitle className="mb-1 text-xl">
              أكمل إعداد هوية متجرك
            </CardTitle>
            <CardDescription className="mb-4 text-sm leading-relaxed">
              قبل اختيار ثيم أو تخصيص التصميم، نحتاج بعض المعلومات الأساسية عن
              علامتك التجارية.
            </CardDescription>

            <div className="mb-5 space-y-2">
              <StepItem done label="اسم المتجر" />
              <StepItem label="رفع الشعار" number={2} />
              <StepItem label="اختيار لوحة الألوان" number={3} />
              <StepItem label="اختيار الخط المفضّل" number={4} />
            </div>

            <div className="flex items-center gap-3">
              <Button variant="secondary" asChild>
                <Link href={storePath("/settings")}>متابعة الإعداد</Link>
              </Button>
              <Button variant="ghost" size="sm">
                تخطّي والاختيار لاحقاً
              </Button>
            </div>
          </div>

          <div className="flex size-32 flex-col items-center justify-center gap-2 rounded-full border-2 border-dashed border-border bg-muted/30">
            <div className="flex gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="size-3.5" />
              </span>
              <span className="flex size-7 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <Palette className="size-3.5" />
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              هوية المتجر
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StepItem({
  done,
  label,
  number,
}: {
  done?: boolean
  label: string
  number?: number
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-xs font-medium",
          done
            ? "bg-emerald-50 text-emerald-600"
            : "border border-border bg-background text-muted-foreground"
        )}
      >
        {done ? <Check className="size-3.5" /> : number}
      </span>
      <span
        className={cn(
          "text-sm",
          done && "text-muted-foreground line-through"
        )}
      >
        {label}
      </span>
    </div>
  )
}

// ─── Stage 2: No Theme CTA ──────────────────────────────────────────────────

function NoThemeCta() {
  return (
    <Card className="border border-border/60">
      <CardContent className="py-6">
        <div className="grid grid-cols-[1fr_auto] items-center gap-6">
          <div>
            <CardTitle className="mb-1 text-xl">اختر ثيماً لمتجرك</CardTitle>
            <CardDescription className="mb-4 text-sm leading-relaxed">
              اختر أحد القوالب الجاهزة أدناه كنقطة انطلاق، ثم خصّصه كما تريد
              من محرر التصميم.
            </CardDescription>
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="primary">
                <Sparkles className="size-3" /> ٦ قوالب متاحة
              </Badge>
              <Badge variant="outline">تخصيص كامل بعد الاختيار</Badge>
            </div>
            <Button variant="secondary">
              <ArrowUpRight data-icon="inline-start" className="size-4" />
              استعرض القوالب
            </Button>
          </div>

          {/* Fanned cards visual */}
          <div className="relative flex size-36 items-center justify-center">
            {[-12, 4, -2].map((rot, i) => (
              <div
                key={i}
                className="absolute h-24 w-[72px] rounded-lg border bg-background p-2 shadow-sm"
                style={{
                  transform: `rotate(${rot}deg) translate(${i === 0 ? "-10px" : i === 1 ? "10px" : "0"}, ${i === 2 ? "0" : "4px"})`,
                  opacity: i === 2 ? 1 : 0.6,
                  zIndex: i === 2 ? 1 : 0,
                }}
              >
                <div className="h-2 w-full rounded-sm bg-muted" />
                <div className="mt-1 h-1.5 w-3/5 rounded-sm bg-muted" />
                <div className="mt-2 flex-1 rounded border bg-muted/30" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Stage 3: Active Theme Hero ──────────────────────────────────────────────

function ActiveThemeCard({
  theme,
  themeEditHref,
  themeMobileEditHref,
  storePath,
}: {
  theme: { name: string; description: string; image?: string }
  themeEditHref: string
  themeMobileEditHref: string
  storePath: (p: string) => string
}) {
  return (
    <Card className="overflow-hidden border border-border/60 p-0">
      <div className="grid gap-0 lg:grid-cols-[1fr_240px]">
        {/* Info side */}
        <div className="flex flex-col justify-between p-6">
          <div>
            <Badge variant="secondary-tonal" className="mb-3">
              <Palette className="size-3" /> الثيم النشط
            </Badge>
            <CardTitle className="mb-1 text-xl">{theme.name}</CardTitle>
            <CardDescription className="max-w-sm text-sm leading-relaxed">
              {theme.description}
            </CardDescription>

            {/* Color swatches */}
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2.5">
              <div className="size-5 rounded-full border border-border/50 bg-primary" />
              <div className="size-5 rounded-full border border-border/50 bg-secondary" />
              <div className="size-5 rounded-full border border-border/50 bg-muted" />
              <div className="size-5 rounded-full border border-border/50 bg-destructive" />
              <span className="me-auto ms-2 text-xs text-muted-foreground">
                الألوان المستخدمة
              </span>
              <Button variant="outline" size="xs" asChild>
                <Link href={themeEditHref}>
                  تغيير <Pencil className="size-3" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={themeEditHref}>
                <Monitor data-icon="inline-start" className="size-4" />
                محرر سطح المكتب
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href={themeMobileEditHref}>
                <Smartphone data-icon="inline-start" className="size-4" />
                محرر الجوال
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={storePath("/design-studio")}>
                <Eye data-icon="inline-start" className="size-4" />
                معاينة
              </Link>
            </Button>
          </div>
        </div>

        {/* Preview side */}
        <div className="relative flex items-center justify-center overflow-hidden border-e border-border/60 bg-gradient-to-br from-stone-100 via-background to-amber-50/30">
          <span className="absolute start-3 top-3 flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            معاينة حية
          </span>

          {theme.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={theme.image}
              alt={theme.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="w-[170px] overflow-hidden rounded-lg border bg-background shadow-sm">
              <div className="h-5 bg-primary" />
              <div className="space-y-2 p-2">
                <div className="h-10 rounded border border-dashed bg-muted/30" />
                <div className="h-1.5 w-4/5 rounded-full bg-foreground/10" />
                <div className="h-1.5 w-3/5 rounded-full bg-foreground/10" />
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="h-8 rounded border bg-muted/20" />
                  <div className="h-8 rounded border bg-muted/20" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// ─── Stage 4a: Mobile App CTA ────────────────────────────────────────────────

function MobileAppCta() {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-text text-xl font-semibold">تطبيق الجوال</h2>
        <p className="text-sm text-muted-foreground">
          أنشئ تطبيق جوال لمتجرك بنقرة واحدة وتابع عدد التثبيتات.
        </p>
      </div>

      <Card className="border border-border/60">
        <CardContent className="py-6">
          <div className="grid grid-cols-[1fr_auto] items-center gap-6">
            <div>
              <Badge variant="destructive" className="mb-3">
                غير مفعّل
              </Badge>
              <CardTitle className="mb-1 text-lg">
                أنشئ تطبيق جوال لمتجرك
              </CardTitle>
              <CardDescription className="mb-4 max-w-md text-sm leading-relaxed">
                حوّل متجرك إلى تطبيق جوال يمكن للعملاء تحميله وتثبيته. التطبيق
                يعكس تصميم ثيمك الحالي تلقائياً.
              </CardDescription>

              <div className="mb-5 flex flex-wrap gap-4">
                <FeatureChip label="مزامنة تلقائية مع الثيم" />
                <FeatureChip label="إشعارات فورية" />
                <FeatureChip label="تصفّح بدون إنترنت" />
              </div>

              <div className="flex gap-2">
                <Button variant="secondary">
                  <Sparkles data-icon="inline-start" className="size-4" />
                  إنشاء التطبيق الآن
                </Button>
                <Button variant="ghost" size="sm">
                  معرفة المزيد
                </Button>
              </div>
            </div>

            {/* Phone wireframe */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex h-36 w-20 flex-col gap-1 rounded-2xl border-2 border-muted-foreground/40 bg-muted/30 p-1.5">
                <div className="mx-auto h-1 w-6 rounded-full bg-muted-foreground/40" />
                <div className="h-4 rounded border bg-muted/40" />
                <div className="h-1 w-3/4 rounded-full bg-muted" />
                <div className="h-1 w-1/2 rounded-full bg-muted" />
                <div className="grid flex-1 grid-cols-2 gap-0.5">
                  <div className="rounded-sm bg-muted/50" />
                  <div className="rounded-sm bg-muted/50" />
                  <div className="rounded-sm bg-muted/50" />
                  <div className="rounded-sm bg-muted/50" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/5">
                  <Plus className="size-6 text-secondary/60" />
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground">
                لم يتم الإنشاء
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function FeatureChip({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="flex size-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <Check className="size-2.5" />
      </span>
      {label}
    </span>
  )
}

// ─── Stage 4b: Mobile App Stats ──────────────────────────────────────────────

function MobileAppStats({ installs }: { installs: number }) {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-text text-xl font-semibold">تطبيق الجوال</h2>
        <p className="text-sm text-muted-foreground">
          تطبيقك جاهز ومتاح للعملاء. يتم تحديثه تلقائياً مع كل تعديل على
          الثيم.
        </p>
      </div>

      <Card className="border border-border/60">
        <CardContent className="py-6">
          <div className="grid grid-cols-[1fr_auto] items-center gap-6">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <CardTitle className="text-lg">
                  تطبيق المتجر للجوال
                </CardTitle>
                <Badge variant="secondary-tonal">
                  <Check className="size-3" /> تم التوليد
                </Badge>
              </div>
              <CardDescription className="mb-4 text-sm leading-relaxed">
                تطبيقك جاهز ومتاح للعملاء. يتم تحديثه تلقائياً مع كل تعديل
                على الثيم.
              </CardDescription>

              <div className="mb-5 flex gap-6">
                <div>
                  <p className="text-2xl font-bold">{installs}</p>
                  <p className="text-xs text-muted-foreground">
                    عدد التثبيتات
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">٤٧</p>
                  <p className="text-xs text-muted-foreground">
                    مستخدم نشط
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">٢.١ MB</p>
                  <p className="text-xs text-muted-foreground">
                    حجم التطبيق
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button>
                  <Settings data-icon="inline-start" className="size-4" />
                  إعدادات التطبيق
                </Button>
                <Button variant="outline">
                  <RefreshCw data-icon="inline-start" className="size-4" />
                  إعادة التوليد
                </Button>
                <Button variant="outline">
                  <Download data-icon="inline-start" className="size-4" />
                  تحميل APK
                </Button>
              </div>
            </div>

            {/* Phone wireframe */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-36 w-20 flex-col gap-1 rounded-2xl border-2 border-muted-foreground/40 bg-muted/30 p-1.5">
                <div className="mx-auto h-1 w-6 rounded-full bg-muted-foreground/40" />
                <div className="h-4 rounded border bg-muted/40" />
                <div className="h-1 w-3/4 rounded-full bg-muted" />
                <div className="h-1 w-1/2 rounded-full bg-muted" />
                <div className="grid flex-1 grid-cols-2 gap-0.5">
                  <div className="rounded-sm bg-muted/50" />
                  <div className="rounded-sm bg-muted/50" />
                  <div className="rounded-sm bg-muted/50" />
                  <div className="rounded-sm bg-muted/50" />
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground">
                معاينة التطبيق
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
