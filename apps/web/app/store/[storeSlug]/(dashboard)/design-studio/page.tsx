"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowUpRight,
  ExternalLink,
  Globe,
  Link2Icon,
  Pencil,
  Sparkles,
  Smartphone,
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
import { useStorePath } from "@/lib/store-path"
import { getStoreSettingsQueryOptions } from "@/modules/store/settings/actions"
import type { StoreStatus } from "@/modules/auth/store/types"

import ThemeMarketplaceCard from "./_components/theme-marketplace-card"
import ThemePreviewCard from "./_components/theme-preview-card"
import { themeCatalog } from "@/modules/design-studio/store-theme"
import {
  buildStudioMobileEditHref,
  themeNameToStudioSegment,
} from "@/lib/design-studio-paths"
import { useSelectedStoreTheme } from "@/modules/design-studio/use-selected-store-theme"

const statusLabels: Record<StoreStatus, string> = {
  ACTIVE: "نشط",
  PAUSED: "متوقف مؤقتاً",
  MAINTENANCE: "صيانة",
  PASSWORD_PROTECTED: "محمي بكلمة مرور",
  CLOSED: "مغلق",
}

const statusBadgeVariant: Record<
  StoreStatus,
  "secondary-tonal" | "outline" | "destructive"
> = {
  ACTIVE: "secondary-tonal",
  PAUSED: "outline",
  MAINTENANCE: "outline",
  PASSWORD_PROTECTED: "outline",
  CLOSED: "destructive",
}

export default function DesignStudioPage() {
  const storePath = useStorePath()
  const { data: settings, isPending } = useQuery(getStoreSettingsQueryOptions())
  const { selectedTheme, selectTheme, isReady } = useSelectedStoreTheme()

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

  // Store status is not yet exposed on the merchant settings endpoint;
  // default to ACTIVE until a dedicated read API is wired.
  const storeStatus: StoreStatus = "ACTIVE"

  return (
    <div className="container space-y-10 py-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          منصة بناء الثيمات
        </p>
        <h1 className="page-title">مصنع الثيمات</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          خصّص مظهر متجرك، راقب حالة الموقع، وعدّل الثيم الحالي من مكان واحد.
        </p>
      </header>

      {/* Current theme overview */}
      {/* <Card className="overflow-hidden border border-border/60">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative min-h-[220px] overflow-hidden border-b border-border/60 bg-gradient-to-br from-stone-200/70 via-background to-rose-100/50 lg:border-e lg:border-b-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.65),_transparent_60%)]" />
            <div className="relative flex h-full flex-col justify-end p-6">
              <Badge variant="secondary-tonal" className="mb-3 w-fit">
                الثيم النشط
              </Badge>
              <p className="text-xs font-medium text-muted-foreground">
                معاينة الثيم
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                سيتم استبدال هذه المعاينة بصورة حقيقية لاحقاً
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4 p-6">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{ATELIER_PRESET.label}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {ATELIER_PRESET.description}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="size-5 rounded-full border border-border/50 shadow-sm"
                style={{ backgroundColor: ATELIER_PRESET.previewColor }}
                aria-hidden
              />
              <span className="text-xs text-muted-foreground">
                لون التمييز — Merriweather + Playfair Display
              </span>
            </div>
          </div>
        </div>
      </Card> */}

      {/* Website status & URL */}
      {/* <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-text text-xl font-semibold">حالة الموقع</h2>
          <p className="text-sm text-muted-foreground">
            رابط متجرك الإلكتروني وحالته أمام العملاء.
          </p>
        </div>

        <Card className="border border-border/60">
          <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                <Globe className="size-5" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-text text-sm font-medium">
                    حالة المتجر
                  </span>
                  <Badge variant={statusBadgeVariant[storeStatus]}>
                    {statusLabels[storeStatus]}
                  </Badge>
                </div>
                {isPending ? (
                  <Skeleton className="h-4 w-48" />
                ) : shopUrl ? (
                  <a
                    href={shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    dir="ltr"
                  >
                    {shopUrl.replace(/^https?:\/\//, "")}
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    أكمل إعداد المتجر لعرض الرابط العام.
                  </p>
                )}
              </div>
            </div>

            <Button variant="outline" size="sm" asChild>
              <Link href={storePath("/settings/access")}>
                إدارة الحالة
                <ArrowUpRight data-icon="inline-end" className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section> */}

      <section className="container rounded-md bg-gray-50 py-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="text-xl font-semibold text-gray-800">
              نوع الثيم الحالي
            </div>
            {isReady && selectedTheme ? (
              <>
                <div className="mt-2 text-lg font-medium text-gray-800">
                  {selectedTheme.name}
                </div>
                <div className="leading-tonal mt-4 max-w-3/4 text-gray-500">
                  {selectedTheme.description}
                </div>
              </>
            ) : (
              <div className="leading-tonal mt-4 max-w-3/4 text-gray-500">
                اختر أحد قوالب الثيمات أدناه لتطبيقه على متجرك.
              </div>
            )}

            <div className="mt-12 rounded-lg bg-gray-200 p-3">
              <div className="text-gray-500">الألوان المستخدمة</div>

              <div className="mt-2 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-6 rounded-full bg-primary"></div>
                  <div className="h-6 w-6 rounded-full bg-secondary"></div>
                  <div className="h-6 w-6 rounded-full bg-muted"></div>
                  <div className="h-6 w-6 rounded-full bg-destructive"></div>
                </div>

                <div className="ms-auto">
                  <Button variant="outline">تغيير الألوان</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid-cols-1">
            <div className="min-h-[400px] w-full overflow-hidden rounded-lg bg-gray-200 p-4">
              {selectedTheme?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedTheme.image}
                  alt={selectedTheme.name}
                  className="size-full rounded-md object-cover"
                />
              ) : null}
            </div>

            <div className="mt-4 flex w-full flex-col gap-2">
              <div className="flex w-full gap-2">
                <Button className="grow" asChild>
                  <Link href={storePath("/design-studio/")}>معاينة</Link>
                </Button>
                <Button className="grow" variant="outline" asChild>
                  <Link href={themeEditHref}>تعديل</Link>
                </Button>
              </div>
              <Button className="w-full" variant="secondary" asChild>
                <Link href={themeMobileEditHref}>
                  <Smartphone data-icon="inline-start" className="size-4" />
                  محرر الجوال
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-gray-50 p-4">
        <div>رابط الموقع</div>

        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <a href="#">https://test.com</a>
          <Link2Icon />
        </div>
      </section>

      {/* Theme marketplace */}
      <section className="space-y-6">
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

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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

      {/* Current theme device previews */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-text text-xl font-semibold">الثيم الحالي</h2>
          <p className="text-sm text-muted-foreground">
            معاينة سريعة لشكل المتجر على الشاشات المختلفة.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ThemePreviewCard variant="desktop" />
          <ThemePreviewCard variant="mobile" />
        </div>
      </section>
    </div>
  )
}
