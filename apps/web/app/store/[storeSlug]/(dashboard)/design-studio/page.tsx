"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowUpRight,
  Check,
  ExternalLink,
  Loader2,
  Monitor,
  Palette,
  Plus,
  Send,
  Smartphone,
  Sparkles,
  Upload,
  Eye,
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
import {
  buildStudioMobileEditHref,
  themeNameToStudioSegment,
} from "@/lib/design-studio-paths"
import {
  getDesignDraftQueryOptions,
  listDesignVersionsQueryOptions,
  publishDesign,
} from "@/modules/design-studio/actions"
import { designStudioKeys } from "@/modules/design-studio/queryKeys"
import {
  applyStudioTemplate,
  readDraftTemplateKey,
  resolveActiveThemeName,
  syncSelectedThemeCache,
  useStudioTemplates,
  type StudioTemplateCard,
} from "@/modules/design-studio/templates"

export default function DesignStudioPage() {
  const storePath = useStorePath()
  const queryClient = useQueryClient()
  const { data: settings, isPending: isSettingsPending } = useQuery(
    getStoreSettingsQueryOptions()
  )
  const { templates, isPending: isTemplatesPending } = useStudioTemplates()
  const { data: draft, isPending: isDraftPending } = useQuery(
    getDesignDraftQueryOptions()
  )
  const { data: versions = [] } = useQuery(listDesignVersionsQueryOptions())
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  const applyTemplateMutation = useMutation({
    mutationFn: applyStudioTemplate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: designStudioKeys.all })
      toast.success("تم تطبيق القالب. افتح المحرر لتخصيصه.")
    },
    onError: () => {
      toast.error("تعذر تطبيق القالب. حاول مرة أخرى.")
    },
  })

  const publishMutation = useMutation({
    mutationFn: publishDesign,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: designStudioKeys.all })
      toast.success("تم نشر التصميم.")
    },
    onError: () => {
      toast.error("تعذر النشر. تحقق من وجود مسودة قابلة للنشر.")
    },
  })

  const editorBase = storePath("/design-studio")
  const activeTemplateKey = readDraftTemplateKey(draft)
  const activeTemplate: StudioTemplateCard | null = useMemo(() => {
    if (!activeTemplateKey) return null
    return templates.find((t) => t.templateKey === activeTemplateKey) ?? null
  }, [activeTemplateKey, templates])

  const activeThemeName = resolveActiveThemeName(draft, templates)

  useEffect(() => {
    syncSelectedThemeCache(draft, templates)
  }, [draft, templates])

  const publishedVersionNumber = useMemo(() => {
    const published = versions
      .filter((v) => v.lifecycleStatus === "PUBLISHED")
      .map((v) => v.versionNumber ?? 0)
    return published.length > 0 ? Math.max(...published) : null
  }, [versions])

  const themeSegment = themeNameToStudioSegment(
    activeThemeName || "Theme 1"
  )
  const themeEditHref = `${editorBase}/${themeSegment}/edit`
  const themeMobileEditHref = buildStudioMobileEditHref(
    editorBase,
    activeThemeName || "Theme 1"
  )
  const themesGalleryHref = themeEditHref

  const storeSlug = settings?.slug ?? ""
  const shopUrl = useMemo(() => {
    if (!storeSlug) return ""
    if (typeof window === "undefined") return `/shop/${storeSlug}`
    return `${window.location.origin}/shop/${storeSlug}`
  }, [storeSlug])

  const hasCompletedConfig = Boolean(settings)
  const hasDraft = Boolean(draft)
  const isReady = !isDraftPending

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
          <div className="flex items-center gap-2">
            {hasDraft && (
              <Button
                variant="default"
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? (
                  <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
                ) : (
                  <Send data-icon="inline-start" className="size-4" />
                )}
                نشر التصميم
              </Button>
            )}
            <Button variant="secondary" onClick={() => setOnboardingOpen(true)}>
              <Plus data-icon="inline-start" className="size-4" />
              إنشاء ثيم مخصص
            </Button>
          </div>
        </div>
      </header>

      {/* Stage 1: Store configuration not done */}
      {!hasCompletedConfig && <StoreConfigCta storePath={storePath} />}

      {/* Stage 2: Config done, no design draft yet */}
      {hasCompletedConfig && isReady && !hasDraft && <NoThemeCta />}

      {/* Stage 3: Active design hero */}
      {hasDraft && draft && (
        <ActiveThemeCard
          themeName={activeThemeName}
          previewImageUrl={activeTemplate?.previewImageUrl ?? null}
          draftVersionNumber={draft.versionNumber}
          publishedVersionNumber={publishedVersionNumber}
          lifecycleStatus={draft.lifecycleStatus}
          themeEditHref={themeEditHref}
          themeMobileEditHref={themeMobileEditHref}
          shopUrl={shopUrl}
          isPending={isSettingsPending}
        />
      )}

      {/* Template marketplace */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-text text-xl font-semibold">قوالب التصميم</h2>
            <p className="text-sm text-muted-foreground">
              استكشف قوالب جاهزة أو طبّق قالباً جديداً على متجرك.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={themesGalleryHref}>افتح المحرر</Link>
          </Button>
        </div>

        {isTemplatesPending ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <Card className="border border-border/60">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              لا توجد قوالب متاحة حالياً.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {templates.map((template) => (
              <ThemeMarketplaceCard
                key={template.templateKey}
                title={template.templateName}
                description={template.description}
                previewImage={template.previewImageUrl ?? undefined}
                isActive={activeTemplateKey === template.templateKey}
                onSelect={() => applyTemplateMutation.mutate(template)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Mobile app section (placeholder) */}
      <MobileAppCta />

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
            <CardTitle className="mb-1 text-xl">اختر قالباً لمتجرك</CardTitle>
            <CardDescription className="mb-4 text-sm leading-relaxed">
              اختر أحد القوالب الجاهزة أدناه كنقطة انطلاق، ثم خصّصه كما تريد
              من محرر التصميم.
            </CardDescription>
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="primary">
                <Sparkles className="size-3" /> قوالب من الخادم
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
  themeName,
  previewImageUrl,
  draftVersionNumber,
  publishedVersionNumber,
  lifecycleStatus,
  themeEditHref,
  themeMobileEditHref,
  shopUrl,
  isPending,
}: {
  themeName: string
  previewImageUrl: string | null
  draftVersionNumber: number | null
  publishedVersionNumber: number | null
  lifecycleStatus: string
  themeEditHref: string
  themeMobileEditHref: string
  shopUrl: string
  isPending: boolean
}) {
  const statusLabel =
    lifecycleStatus === "PUBLISHED"
      ? "منشور"
      : lifecycleStatus === "DRAFT"
        ? "مسودة"
        : lifecycleStatus
  return (
    <Card className="overflow-hidden border border-border/60 p-0">
      {/* Two-column: image (inline-start / right in RTL) | info */}
      <div className="flex flex-wrap">
        {/* Image side – first in DOM → inline-start (right in RTL) */}
        <div className="relative min-h-[280px] basis-80 flex-shrink-0 bg-gradient-to-br from-stone-100 via-background to-amber-50/30">
          <span className="absolute start-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-bold text-emerald-600">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {statusLabel}
          </span>

          {previewImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewImageUrl}
              alt={themeName}
              className="size-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
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
            </div>
          )}
        </div>

        {/* Info side */}
        <div className="flex min-w-80 flex-1 flex-col gap-5 p-7">
          <div>
            <Badge variant="secondary-tonal" className="mb-3">
              <Palette className="size-3" /> التصميم النشط
            </Badge>
            <h2 className="mb-2 text-2xl font-extrabold">{themeName}</h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {publishedVersionNumber
                ? `آخر إصدار منشور: v${publishedVersionNumber}`
                : "لم يتم النشر بعد. استكمل التخصيص من المحرر ثم اضغط نشر."}
              {draftVersionNumber ? ` · المسودة v${draftVersionNumber}` : ""}
            </p>
          </div>

          {/* Action buttons */}
          <div className="mt-auto flex flex-wrap gap-2.5 pt-2">
            <Button variant="outline" asChild>
              <Link href={shopUrl || themeEditHref}>
                <Eye data-icon="inline-start" className="size-4" />
                معاينة
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href={themeMobileEditHref}>
                <Smartphone data-icon="inline-start" className="size-4" />
                محرر الجوال
              </Link>
            </Button>
            <Button asChild>
              <Link href={themeEditHref}>
                <Monitor data-icon="inline-start" className="size-4" />
                محرر سطح المكتب
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Store URL footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-8 py-4">
        <span className="text-sm text-muted-foreground">رابط المتجر</span>
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
    </Card>
  )
}

// ─── Mobile App CTA (unchanged placeholder) ─────────────────────────────────

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
        <CardContent className="py-8">
          <div className="flex flex-wrap items-center gap-10">
            {/* Phone mockup */}
            <div className="flex-shrink-0">
              <div className="flex h-[280px] w-[140px] flex-col rounded-[28px] border-[8px] border-foreground/80 bg-foreground/80 p-1.5">
                <div className="relative flex-1 overflow-hidden rounded-[18px] bg-muted">
                  <div className="flex h-full flex-col gap-1.5 p-2">
                    <div className="h-4 rounded bg-primary/20" />
                    <div className="h-1.5 w-3/4 rounded-full bg-muted-foreground/20" />
                    <div className="h-1.5 w-1/2 rounded-full bg-muted-foreground/20" />
                    <div className="mt-1 grid flex-1 grid-cols-2 gap-1">
                      <div className="rounded bg-muted-foreground/10" />
                      <div className="rounded bg-muted-foreground/10" />
                      <div className="rounded bg-muted-foreground/10" />
                      <div className="rounded bg-muted-foreground/10" />
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center rounded-[18px] bg-background/50">
                    <Plus className="size-8 text-muted-foreground/40" />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                لم يتم الإنشاء
              </p>
            </div>

            {/* Info */}
            <div className="flex min-w-[280px] flex-1 flex-col gap-3.5">
              <Badge variant="destructive" className="self-start">
                غير مفعّل
              </Badge>
              <h3 className="text-lg font-extrabold">
                أنشئ تطبيق جوال لمتجرك
              </h3>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                حوّل متجرك إلى تطبيق جوال يمكن للعملاء تحميله وتثبيته.
                التطبيق يعكس تصميم ثيمك الحالي تلقائياً.
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <Button variant="ghost" size="sm">
                  معرفة المزيد
                </Button>
                <Button variant="secondary">
                  <Sparkles data-icon="inline-start" className="size-4" />
                  إنشاء التطبيق الآن
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
