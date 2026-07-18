"use client"

import { useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Palette,
  Ruler,
  SquareRoundCorner,
  LayoutTemplate,
  Layers,
  Eye,
  Upload,
  Sparkles,
  Type,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

import {
  DEFAULT_COLORS,
  DEFAULT_SHELL,
  FONT_OPTIONS,
  type ColorTheme,
  type ScaleThemeProps,
  type FullThemeProps,
  type BadgeShape,
  type BadgeStyle,
} from "@/core/config/theme"
import {
  normalizeSiteData,
  writeSiteData,
  type SiteData,
  type SitePage,
} from "@/core/config/lib/site-data"
import { DEFAULT_HEADER_LINKS, type HeaderLink } from "@/core/config/components/Header"
import { DEFAULT_FOOTER_COLUMNS, type FooterColumn } from "@/core/config/components/Footer"
import {
  createProductCardBlock,
  createStorefrontProductCardBlock,
  createProductsGridSection,
} from "@/core/config/presets/products-grid"
import {
  createCartPageContent,
  FORMS_PRESETS,
  GENERAL_PRESETS,
  HERO_PRESETS,
  type SectionPreset,
} from "@/core/config/presets"
import { buildStudioEditHref } from "@/lib/design-studio-paths"

// ─── Steps ──────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "المعلومات", icon: Monitor },
  { id: 2, label: "الألوان", icon: Palette },
  { id: 3, label: "الخطوط", icon: Type },
  { id: 4, label: "الأحجام", icon: Ruler },
  { id: 5, label: "الأشكال", icon: SquareRoundCorner },
  { id: 6, label: "التخطيط", icon: LayoutTemplate },
  { id: 7, label: "الأقسام", icon: Layers },
  { id: 8, label: "المعاينة", icon: Eye },
] as const

const DEFAULT_HERO_PRESET_ID = HERO_PRESETS[0]?.id ?? "hero-bg-image"
const DEFAULT_GENERAL_SECTION_IDS = GENERAL_PRESETS.map((preset) => preset.id)

const TOTAL_STEPS = STEPS.length

// ─── Color Palettes (mapped to real ColorTheme) ─────────────────────────────

type ColorPaletteOption = {
  id: string
  name: string
  preview: string[]
  colors: ColorTheme
}

const COLOR_PALETTES: ColorPaletteOption[] = [
  {
    id: "default-blue",
    name: "أزرق احترافي",
    preview: ["#0b78c5", "#f6f8fc", "#14243f", "#6b7d93"],
    colors: { ...DEFAULT_COLORS },
  },
  {
    id: "classic-dark",
    name: "كلاسيكي داكن",
    preview: ["#122640", "#BA7B1B", "#e6edf4", "#f8f5f0"],
    colors: {
      primary: "#122640",
      surface: "#f8f5f0",
      success: "#166534",
      warning: "#BA7B1B",
      error: "#b91c1c",
      dark: "#0f1c2e",
      text: "#1e293b",
      neutral: "#64748b",
    },
  },
  {
    id: "modern-red",
    name: "عصري أحمر",
    preview: ["#e94560", "#1a1a2e", "#f5f5f5", "#ffffff"],
    colors: {
      primary: "#e94560",
      surface: "#f5f5f5",
      success: "#22c55e",
      warning: "#eab308",
      error: "#dc2626",
      dark: "#1a1a2e",
      text: "#1a1a2e",
      neutral: "#6b7280",
    },
  },
  {
    id: "natural-green",
    name: "طبيعي أخضر",
    preview: ["#2d6a4f", "#95d5b2", "#f0f7f4", "#fefcfb"],
    colors: {
      primary: "#2d6a4f",
      surface: "#f0f7f4",
      success: "#059669",
      warning: "#d97706",
      error: "#dc2626",
      dark: "#1b4332",
      text: "#1b4332",
      neutral: "#6b7d6e",
    },
  },
  {
    id: "purple-luxury",
    name: "بنفسجي فاخر",
    preview: ["#7c3aed", "#c17bce", "#f3e8f9", "#faf7fc"],
    colors: {
      primary: "#7c3aed",
      surface: "#faf7fc",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      dark: "#4a1942",
      text: "#3b0764",
      neutral: "#8b5cf6",
    },
  },
  {
    id: "warm-orange",
    name: "دافئ برتقالي",
    preview: ["#ea580c", "#e8853d", "#fdf0e6", "#fffcf9"],
    colors: {
      primary: "#ea580c",
      surface: "#fdf0e6",
      success: "#16a34a",
      warning: "#d97706",
      error: "#dc2626",
      dark: "#5c2e0e",
      text: "#431407",
      neutral: "#9a7b6b",
    },
  },
]

// ─── Font presets ───────────────────────────────────────────────────────────

type FontPreset = {
  id: string
  name: string
  bodyFont: string
  fontOption1: string
  fontOption2: string
}

const FONT_PRESETS: FontPreset[] = [
  { id: "default", name: "النظام الافتراضي", bodyFont: "dm-sans", fontOption1: "space-grotesk", fontOption2: "fraunces" },
  { id: "modern", name: "عصري نظيف", bodyFont: "inter", fontOption1: "manrope", fontOption2: "sora" },
  { id: "elegant", name: "أنيق كلاسيكي", bodyFont: "merriweather", fontOption1: "playfair-display", fontOption2: "raleway" },
  { id: "friendly", name: "ودود مرح", bodyFont: "nunito", fontOption1: "poppins", fontOption2: "lora" },
  { id: "minimal", name: "بسيط ومباشر", bodyFont: "open-sans", fontOption1: "montserrat", fontOption2: "roboto" },
  { id: "tech", name: "تقني حديث", bodyFont: "geist", fontOption1: "space-grotesk", fontOption2: "inter" },
]

// ─── Sizing presets (mapped to ScaleThemeProps) ─────────────────────────────

type SizingPreset = {
  id: string
  name: string
  description: string
  scales: Partial<ScaleThemeProps>
}

const SIZING_PRESETS: SizingPreset[] = [
  {
    id: "compact",
    name: "مضغوط",
    description: "محتوى كثيف، مسافات قليلة",
    scales: {
      textSizeSm: "0.8125rem",
      textSizeMd: "0.9375rem",
      textSizeLg: "1.0625rem",
      radiusSm: "6px",
      radiusMd: "8px",
      radiusLg: "12px",
      buttonSmHeight: "30px",
      buttonMdHeight: "38px",
      buttonLgHeight: "46px",
    },
  },
  {
    id: "balanced",
    name: "متوازن",
    description: "توازن بين المحتوى والمساحات",
    scales: {},
  },
  {
    id: "spacious",
    name: "واسع",
    description: "مساحات كبيرة، تنفّس بصري",
    scales: {
      textSizeMd: "1.0625rem",
      textSizeLg: "1.3125rem",
      textSizeXl: "1.5rem",
      textSize2xl: "2rem",
      radiusSm: "10px",
      radiusMd: "14px",
      radiusLg: "20px",
      radiusXl: "28px",
      buttonSmHeight: "38px",
      buttonMdHeight: "48px",
      buttonLgHeight: "58px",
      buttonSmPaddingX: "16px",
      buttonMdPaddingX: "22px",
      buttonLgPaddingX: "30px",
    },
  },
  {
    id: "luxury",
    name: "فاخر",
    description: "مساحات سخية، إحساس راقي",
    scales: {
      textSizeMd: "1.125rem",
      textSizeLg: "1.375rem",
      textSizeXl: "1.625rem",
      textSize2xl: "2.25rem",
      radiusSm: "12px",
      radiusMd: "18px",
      radiusLg: "24px",
      radiusXl: "32px",
      radiusFull: "9999px",
      buttonSmHeight: "40px",
      buttonMdHeight: "52px",
      buttonLgHeight: "62px",
      buttonSmPaddingX: "18px",
      buttonMdPaddingX: "26px",
      buttonLgPaddingX: "34px",
    },
  },
]

// ─── Shape presets ──────────────────────────────────────────────────────────

type ShapeOption = { id: string; name: string; radius: string }

const BUTTON_SHAPES: ShapeOption[] = [
  { id: "sharp", name: "حاد", radius: "0px" },
  { id: "soft", name: "ناعم", radius: "8px" },
  { id: "rounded", name: "مدوّر", radius: "14px" },
  { id: "pill", name: "كبسولة", radius: "9999px" },
]

const BADGE_SHAPES: { id: BadgeShape; name: string }[] = [
  { id: "square", name: "مربع" },
  { id: "rounded", name: "مدوّر" },
  { id: "pill", name: "كبسولة" },
]

const BADGE_STYLES: { id: BadgeStyle; name: string }[] = [
  { id: "solid", name: "ممتلئ" },
  { id: "outline", name: "محدد" },
  { id: "soft", name: "ناعم" },
]

// ─── Header layout presets ──────────────────────────────────────────────────

type HeaderPreset = {
  id: string
  name: string
  links: HeaderLink[]
  backgroundColor: string
  textColor: string
}

const HEADER_PRESETS: HeaderPreset[] = [
  {
    id: "default",
    name: "كلاسيكي",
    links: DEFAULT_HEADER_LINKS,
    backgroundColor: "",
    textColor: "",
  },
  {
    id: "dark",
    name: "داكن",
    links: DEFAULT_HEADER_LINKS,
    backgroundColor: "#1a1a2e",
    textColor: "#ffffff",
  },
  {
    id: "minimal",
    name: "بسيط",
    links: [
      { label: "Home", labelAr: "الرئيسية", link: { kind: "page", pageId: "/" } },
      { label: "Shop", labelAr: "المتجر", link: { kind: "page", pageId: "/products/example-product" } },
    ],
    backgroundColor: "",
    textColor: "",
  },
]

// ─── Footer layout presets ──────────────────────────────────────────────────

type FooterPreset = {
  id: string
  name: string
  columns: FooterColumn[]
  tagline: string
  taglineAr: string
  backgroundColor: string
  textColor: string
}

const FOOTER_PRESETS: FooterPreset[] = [
  {
    id: "three-col",
    name: "٣ أعمدة",
    columns: DEFAULT_FOOTER_COLUMNS,
    tagline: "",
    taglineAr: "",
    backgroundColor: "",
    textColor: "",
  },
  {
    id: "two-col",
    name: "عمودين",
    columns: DEFAULT_FOOTER_COLUMNS.slice(0, 2),
    tagline: "",
    taglineAr: "",
    backgroundColor: "",
    textColor: "",
  },
  {
    id: "dark",
    name: "داكن بسيط",
    columns: [
      {
        title: "Links",
        titleAr: "روابط",
        links: [
          { label: "Home", labelAr: "الرئيسية", link: { kind: "page", pageId: "/" } },
          { label: "Shop", labelAr: "المتجر", link: { kind: "page", pageId: "/products/example-product" } },
          { label: "Cart", labelAr: "السلة", link: { kind: "page", pageId: "/cart" } },
        ],
      },
    ],
    tagline: "Your Store",
    taglineAr: "متجرك",
    backgroundColor: "#1a1a2e",
    textColor: "#ffffff",
  },
]

// ─── Product card presets ────────────────────────────────────────────────────

type ProductCardPreset = {
  id: string
  name: string
  description: string
}

const PRODUCT_CARD_PRESETS: ProductCardPreset[] = [
  { id: "full", name: "بطاقة كاملة", description: "صورة + وصف + سعر + إضافة للسلة + عرض التفاصيل" },
  { id: "storefront", name: "واجهة المتجر", description: "صورة + عنوان + سعر + زر التفاصيل" },
  { id: "minimal", name: "بسيطة", description: "صورة + عنوان + سعر فقط" },
]

// ─── Stepper state ──────────────────────────────────────────────────────────

type OnboardingState = {
  storeName: string
  storeDescription: string
  logo: File | null
  paletteId: string
  fontPresetId: string
  sizingId: string
  buttonShapeId: string
  badgeShape: BadgeShape
  badgeStyle: BadgeStyle
  headerPresetId: string
  footerPresetId: string
  productCardPresetId: string
  /** Selected hero preset for the home page */
  heroPresetId: string
  /** Selected general section presets for the home page (ordered) */
  generalSectionIds: string[]
}

// ─── Component ──────────────────────────────────────────────────────────────

type ThemeOnboardingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ThemeOnboardingDialog({
  open,
  onOpenChange,
}: ThemeOnboardingDialogProps) {
  const router = useRouter()
  const params = useParams()
  const storeSlug = params.storeSlug as string

  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<OnboardingState>({
    storeName: "",
    storeDescription: "",
    logo: null,
    paletteId: "default-blue",
    fontPresetId: "default",
    sizingId: "balanced",
    buttonShapeId: "soft",
    badgeShape: "rounded",
    badgeStyle: "solid",
    headerPresetId: "default",
    footerPresetId: "three-col",
    productCardPresetId: "full",
    heroPresetId: DEFAULT_HERO_PRESET_ID,
    generalSectionIds: DEFAULT_GENERAL_SECTION_IDS,
  })

  const updateData = useCallback(
    <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => {
      setData((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const goNext = () => {
    if (currentStep < TOTAL_STEPS) setCurrentStep((s) => s + 1)
  }
  const goPrev = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1)
  }

  const handleComplete = () => {
    const siteData = buildSiteDataFromState(data)
    writeSiteData(normalizeSiteData(siteData))

    onOpenChange(false)
    setCurrentStep(1)

    const studioBase = `/store/${storeSlug}/design-studio`
    const themeName = data.storeName.trim() || "Theme 1"
    router.push(buildStudioEditHref(studioBase, themeName))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="gap-0 p-0" showCloseButton>
        <DialogHeader className="border-b p-5 pb-4">
          <DialogTitle>إنشاء ثيم مخصص</DialogTitle>
          <DialogDescription>
            أكمل الخطوات التالية لبناء ثيم يعكس هوية متجرك.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper bar */}
        <div className="flex items-center gap-0 border-b bg-muted/30 px-5 py-3">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-0">
              <button
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors",
                    currentStep === step.id &&
                      "border-primary bg-primary text-primary-foreground",
                    currentStep > step.id &&
                      "border-emerald-300 bg-emerald-50 text-emerald-600",
                    currentStep < step.id &&
                      "border-border bg-background text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="size-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={cn(
                    "max-w-[64px] truncate text-[10px]",
                    currentStep === step.id
                      ? "font-medium text-primary"
                      : currentStep > step.id
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 w-6 flex-shrink-0 rounded-full lg:w-8",
                    currentStep > step.id ? "bg-emerald-300" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[460px] overflow-y-auto p-6">
          {currentStep === 1 && <StepStoreInfo data={data} updateData={updateData} />}
          {currentStep === 2 && <StepColors data={data} updateData={updateData} />}
          {currentStep === 3 && <StepFonts data={data} updateData={updateData} />}
          {currentStep === 4 && <StepSizing data={data} updateData={updateData} />}
          {currentStep === 5 && <StepShapes data={data} updateData={updateData} />}
          {currentStep === 6 && <StepLayout data={data} updateData={updateData} />}
          {currentStep === 7 && <StepHomeBlocks data={data} updateData={updateData} />}
          {currentStep === 8 && <StepPreview data={data} />}
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between border-t bg-muted/30 px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={currentStep === 1}
          >
            <ChevronRight data-icon="inline-start" className="size-4" />
            السابق
          </Button>

          {currentStep < TOTAL_STEPS ? (
            <Button onClick={goNext}>
              التالي
              <ChevronLeft data-icon="inline-end" className="size-4" />
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleComplete}>
              <Sparkles data-icon="inline-start" className="size-4" />
              ابدأ التحرير في المحرر
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Build SiteData from stepper state ──────────────────────────────────────

function clonePresetSection(preset: SectionPreset): SitePage["content"][number] {
  return structuredClone(preset.componentData) as SitePage["content"][number]
}

function findFormPreset(id: string): SectionPreset | undefined {
  return FORMS_PRESETS.find((preset) => preset.id === id)
}

function buildSiteDataFromState(state: OnboardingState): Partial<SiteData> {
  const palette = (COLOR_PALETTES.find((p) => p.id === state.paletteId) ?? COLOR_PALETTES[0])!
  const fontPreset = (FONT_PRESETS.find((f) => f.id === state.fontPresetId) ?? FONT_PRESETS[0])!
  const sizing = (SIZING_PRESETS.find((s) => s.id === state.sizingId) ?? SIZING_PRESETS[1])!
  const headerPreset = (HEADER_PRESETS.find((h) => h.id === state.headerPresetId) ?? HEADER_PRESETS[0])!
  const footerPreset = (FOOTER_PRESETS.find((f) => f.id === state.footerPresetId) ?? FOOTER_PRESETS[0])!

  const buttonRadius = BUTTON_SHAPES.find((s) => s.id === state.buttonShapeId)?.radius ?? "8px"

  const themeProps: FullThemeProps = {
    bodyFont: fontPreset.bodyFont,
    fontOption1: fontPreset.fontOption1,
    fontOption2: fontPreset.fontOption2,
    ...palette.colors,
    badgeShape: state.badgeShape,
    badgeStyle: state.badgeStyle,
    ...DEFAULT_SHELL,
    ...sizing.scales,
    buttonVariantPrimaryRadius: buttonRadius,
    buttonVariantSecondaryRadius: buttonRadius,
    buttonVariantErrorRadius: buttonRadius,
    buttonVariantPrimaryBg: palette.colors.primary,
    buttonVariantPrimaryFg: "#ffffff",
    buttonVariantSecondaryBg: palette.colors.neutral,
    buttonVariantSecondaryFg: "#ffffff",
    buttonVariantErrorBg: palette.colors.error,
    buttonVariantErrorFg: "#ffffff",
  }

  const rootProps: Record<string, unknown> = {
    title: state.storeName || "متجر Ertqaa",
    direction: "rtl",
    language: "ar",
    currency: "SYP",
    ...themeProps,
    headerVisible: true,
    headerBrandHref: "/",
    headerBrandTitle: state.storeName || "",
    headerLinks: headerPreset.links,
    headerBackgroundColor: headerPreset.backgroundColor,
    headerTextColor: headerPreset.textColor,
    headerShowDrawerButton: false,
    footerVisible: true,
    footerTagline: footerPreset.tagline,
    footerTaglineAr: footerPreset.taglineAr,
    footerColumns: footerPreset.columns,
    footerBackgroundColor: footerPreset.backgroundColor,
    footerTextColor: footerPreset.textColor,
  }

  const productCardBlock =
    state.productCardPresetId === "storefront"
      ? createStorefrontProductCardBlock()
      : state.productCardPresetId === "minimal"
        ? createStorefrontProductCardBlock({ content: undefined })
        : createProductCardBlock()

  const heroPreset =
    HERO_PRESETS.find((preset) => preset.id === state.heroPresetId) ?? HERO_PRESETS[0]
  const generalPresets = state.generalSectionIds
    .map((id) => GENERAL_PRESETS.find((preset) => preset.id === id))
    .filter((preset): preset is SectionPreset => Boolean(preset))

  const homePageContent: SitePage["content"] = []
  if (heroPreset) {
    homePageContent.push(clonePresetSection(heroPreset))
  }
  for (const preset of generalPresets) {
    homePageContent.push(clonePresetSection(preset))
  }
  homePageContent.push(
    createProductsGridSection({
      content: [productCardBlock],
    }) as SitePage["content"][number]
  )

  const loginPreset = findFormPreset("form-login")
  const verifyOtpPreset = findFormPreset("form-verify-otp")

  const homePage: SitePage = {
    path: "/",
    slug: "/",
    name: "الرئيسية",
    link: "/",
    title: state.storeName || "الرئيسية",
    description: state.storeDescription || "",
    iconName: "Home",
    content: homePageContent,
  }

  const cartPage: SitePage = {
    path: "/cart",
    slug: "/cart",
    name: "السلة",
    link: "/cart",
    title: "السلة",
    description: "سلة التسوق والدفع",
    iconName: "ShoppingCart",
    content: createCartPageContent() as SitePage["content"],
  }

  const loginPage: SitePage = {
    path: "/login",
    slug: "/login",
    name: "تسجيل الدخول",
    link: "/login",
    title: "تسجيل الدخول",
    description: "صفحة تسجيل الدخول",
    iconName: "FileText",
    content: loginPreset
      ? ([clonePresetSection(loginPreset)] as SitePage["content"])
      : [],
  }

  const verifyOtpPage: SitePage = {
    path: "/verify-otp",
    slug: "/verify-otp",
    name: "التحقق من الرمز",
    link: "/verify-otp",
    title: "التحقق من الرمز",
    description: "صفحة التحقق من رمز OTP",
    iconName: "FileText",
    content: verifyOtpPreset
      ? ([clonePresetSection(verifyOtpPreset)] as SitePage["content"])
      : [],
  }

  return {
    root: { props: rootProps },
    zones: {},
    pages: [homePage, cartPage, loginPage, verifyOtpPage],
  }
}

// ─── Step Components ────────────────────────────────────────────────────────

type StepProps = {
  data: OnboardingState
  updateData: <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => void
}

// ─── Step 1: Store Info ─────────────────────────────────────────────────────

function StepStoreInfo({ data, updateData }: StepProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold">معلومات المتجر الأساسية</h3>
      <p className="text-sm text-muted-foreground">
        عرّفنا على متجرك — هذه المعلومات ستظهر في الهيدر وصفحة &quot;من نحن&quot;.
      </p>

      <div className="flex gap-5 pt-4">
        <div className="flex-shrink-0">
          <Label>شعار المتجر</Label>
          <label className="mt-1 flex size-[100px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-secondary hover:bg-secondary/5">
            {data.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={URL.createObjectURL(data.logo)}
                alt=""
                className="size-full rounded-xl object-cover"
              />
            ) : (
              <>
                <Upload className="size-6" />
                <span className="text-xs">رفع الشعار</span>
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/png,image/svg+xml,image/jpeg"
              onChange={(e) => updateData("logo", e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="mt-1 text-[11px] text-muted-foreground">PNG أو SVG, حتى 2MB</p>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <Label htmlFor="store-name">اسم المتجر</Label>
            <Input
              id="store-name"
              value={data.storeName}
              onChange={(e) => updateData("storeName", e.target.value)}
              placeholder="مثال: متجر الأناقة"
            />
          </div>
          <div>
            <Label htmlFor="store-desc">وصف مختصر</Label>
            <Textarea
              id="store-desc"
              value={data.storeDescription}
              onChange={(e) => updateData("storeDescription", e.target.value)}
              placeholder="متجر إلكتروني متخصص في..."
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              يظهر في محركات البحث وأسفل اسم المتجر
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Colors ─────────────────────────────────────────────────────────

function StepColors({ data, updateData }: StepProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold">لوحة الألوان</h3>
      <p className="text-sm text-muted-foreground">
        اختر لوحة ألوان تناسب هوية متجرك. يمكنك تعديلها لاحقاً من المحرر.
      </p>

      <div className="grid grid-cols-2 gap-3 pt-4 lg:grid-cols-3">
        {COLOR_PALETTES.map((palette) => (
          <button
            key={palette.id}
            type="button"
            onClick={() => updateData("paletteId", palette.id)}
            className={cn(
              "rounded-xl border-2 p-3 text-start transition-colors",
              data.paletteId === palette.id
                ? "border-secondary bg-secondary/5"
                : "border-transparent bg-muted/30 hover:border-border"
            )}
          >
            <span className="text-xs font-medium">{palette.name}</span>
            <div className="mt-2 flex gap-1.5">
              {palette.preview.map((c, i) => (
                <span
                  key={i}
                  className="size-5 rounded-full border border-border/50"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="mt-2 flex h-5 overflow-hidden rounded-md">
              {palette.preview.map((c, i) => (
                <span key={i} className="flex-1" style={{ backgroundColor: c }} />
              ))}
            </div>
            {data.paletteId === palette.id && (
              <div className="mt-2 flex items-center gap-1 text-[11px] text-secondary">
                <Check className="size-3" /> محدد
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 3: Fonts ──────────────────────────────────────────────────────────

function StepFonts({ data, updateData }: StepProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold">نوع الخط</h3>
      <p className="text-sm text-muted-foreground">
        اختر مجموعة خطوط تحدد شخصية متجرك. تشمل خط الجسم والعناوين الرئيسية والثانوية.
      </p>

      <div className="grid grid-cols-2 gap-3 pt-4 lg:grid-cols-3">
        {FONT_PRESETS.map((preset) => {
          const bodyEntry = FONT_OPTIONS.find((f) => f.value === preset.bodyFont)
          const headingEntry = FONT_OPTIONS.find((f) => f.value === preset.fontOption1)

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => updateData("fontPresetId", preset.id)}
              className={cn(
                "flex flex-col gap-2 rounded-xl border-2 p-4 text-start transition-colors",
                data.fontPresetId === preset.id
                  ? "border-secondary bg-secondary/5"
                  : "border-transparent bg-muted/30 hover:border-border"
              )}
            >
              <span className="text-sm font-medium">{preset.name}</span>
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">
                  جسم: {bodyEntry?.label ?? preset.bodyFont}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  عناوين: {headingEntry?.label ?? preset.fontOption1}
                </p>
              </div>
              <div className="mt-1 rounded-lg border bg-background p-2">
                <p className="text-sm font-semibold" style={{ fontFamily: headingEntry?.cssValue }}>
                  عنوان تجريبي
                </p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: bodyEntry?.cssValue }}>
                  نص تجريبي لمعاينة الخط
                </p>
              </div>
              {data.fontPresetId === preset.id && (
                <div className="flex items-center gap-1 text-[11px] text-secondary">
                  <Check className="size-3" /> محدد
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 4: Sizing ─────────────────────────────────────────────────────────

function StepSizing({ data, updateData }: StepProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold">أسلوب الأحجام والمسافات</h3>
      <p className="text-sm text-muted-foreground">
        اختر الكثافة البصرية العامة لتصميم متجرك.
      </p>

      <div className="grid grid-cols-2 gap-4 pt-4 lg:grid-cols-4">
        {SIZING_PRESETS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => updateData("sizingId", opt.id)}
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-colors",
              data.sizingId === opt.id
                ? "border-secondary bg-secondary/5"
                : "border-transparent bg-muted/30 hover:border-border"
            )}
          >
            <span className="text-sm font-medium">{opt.name}</span>
            <span className="text-center text-[11px] text-muted-foreground">
              {opt.description}
            </span>
            <SizingDemo variant={opt.id} />
          </button>
        ))}
      </div>
    </div>
  )
}

function SizingDemo({ variant }: { variant: string }) {
  const gap = variant === "compact" ? 2 : variant === "balanced" ? 4 : variant === "spacious" ? 6 : 8
  const pad = variant === "compact" ? 6 : variant === "balanced" ? 8 : variant === "spacious" ? 10 : 12
  const barH = variant === "compact" ? 6 : variant === "balanced" ? 8 : variant === "spacious" ? 10 : 10
  const cardH = variant === "compact" ? 16 : variant === "balanced" ? 20 : variant === "spacious" ? 24 : 28
  const btnPad = variant === "compact" ? "2px 0" : variant === "balanced" ? "3px 0" : variant === "spacious" ? "4px 0" : "5px 0"

  return (
    <div
      className="w-full rounded-lg border bg-background"
      style={{ padding: `${pad}px`, display: "flex", flexDirection: "column", gap: `${gap}px` }}
    >
      <div className="rounded bg-muted" style={{ height: barH }} />
      <div className="flex" style={{ gap: `${gap}px` }}>
        <div className="flex-1 rounded border bg-muted/50" style={{ height: cardH }} />
        <div className="flex-1 rounded border bg-muted/50" style={{ height: cardH }} />
        <div className="flex-1 rounded border bg-muted/50" style={{ height: cardH }} />
      </div>
      <div
        className="w-full rounded bg-primary text-center text-[9px] text-primary-foreground"
        style={{ padding: btnPad }}
      >
        زر
      </div>
    </div>
  )
}

// ─── Step 5: Shapes ─────────────────────────────────────────────────────────

function StepShapes({ data, updateData }: StepProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold">أشكال العناصر</h3>
      <p className="text-sm text-muted-foreground">
        حدد شكل الأزرار والشارات.
      </p>

      <div className="space-y-6 pt-4">
        {/* Button shape */}
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <SquareRoundCorner className="size-4" /> شكل الأزرار
          </p>
          <div className="grid grid-cols-4 gap-3">
            {BUTTON_SHAPES.map((shape) => (
              <button
                key={shape.id}
                type="button"
                onClick={() => updateData("buttonShapeId", shape.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-colors",
                  data.buttonShapeId === shape.id
                    ? "border-secondary bg-secondary/5"
                    : "border-transparent bg-muted/30 hover:border-border"
                )}
              >
                <span
                  className="bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
                  style={{ borderRadius: shape.radius }}
                >
                  شراء الآن
                </span>
                <span className="text-xs font-medium">{shape.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Badge shape */}
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <SquareRoundCorner className="size-4" /> شكل الشارات (الخصم، المخزون)
          </p>
          <div className="grid grid-cols-3 gap-3">
            {BADGE_SHAPES.map((shape) => (
              <button
                key={shape.id}
                type="button"
                onClick={() => updateData("badgeShape", shape.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-colors",
                  data.badgeShape === shape.id
                    ? "border-secondary bg-secondary/5"
                    : "border-transparent bg-muted/30 hover:border-border"
                )}
              >
                <span
                  className="bg-red-500 px-3 py-0.5 text-[10px] font-semibold text-white"
                  style={{
                    borderRadius: shape.id === "pill" ? "9999px" : shape.id === "square" ? "2px" : "8px",
                  }}
                >
                  -20%
                </span>
                <span className="text-xs font-medium">{shape.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Badge style */}
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Palette className="size-4" /> نمط الشارات
          </p>
          <div className="grid grid-cols-3 gap-3">
            {BADGE_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => updateData("badgeStyle", style.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-colors",
                  data.badgeStyle === style.id
                    ? "border-secondary bg-secondary/5"
                    : "border-transparent bg-muted/30 hover:border-border"
                )}
              >
                <span
                  className="px-3 py-0.5 text-[10px] font-semibold"
                  style={{
                    borderRadius: "8px",
                    ...(style.id === "solid"
                      ? { backgroundColor: "#ef4444", color: "#fff" }
                      : style.id === "outline"
                        ? { backgroundColor: "transparent", border: "1.5px solid #ef4444", color: "#ef4444" }
                        : { backgroundColor: "#fee2e2", color: "#ef4444" }),
                  }}
                >
                  -20%
                </span>
                <span className="text-xs font-medium">{style.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 6: Layout (Header + Footer + Product Card) ────────────────────────

function StepLayout({ data, updateData }: StepProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold">التخطيط والمكونات</h3>
      <p className="text-sm text-muted-foreground">
        اختر شكل الهيدر والفوتر وبطاقة المنتج.
      </p>

      <div className="space-y-6 pt-4">
        {/* Header */}
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <LayoutTemplate className="size-4 text-secondary" /> الهيدر
          </p>
          <div className="grid grid-cols-3 gap-3">
            {HEADER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => updateData("headerPresetId", preset.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-colors",
                  data.headerPresetId === preset.id
                    ? "border-secondary bg-secondary/5"
                    : "border-transparent bg-muted/30 hover:border-border"
                )}
              >
                <HeaderWireframe variant={preset.id} />
                <span className="text-xs font-medium">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <LayoutTemplate className="size-4 text-secondary" /> الفوتر
          </p>
          <div className="grid grid-cols-3 gap-3">
            {FOOTER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => updateData("footerPresetId", preset.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-colors",
                  data.footerPresetId === preset.id
                    ? "border-secondary bg-secondary/5"
                    : "border-transparent bg-muted/30 hover:border-border"
                )}
              >
                <FooterWireframe variant={preset.id} />
                <span className="text-xs font-medium">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product card */}
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <LayoutTemplate className="size-4 text-secondary" /> بطاقة المنتج
          </p>
          <div className="grid grid-cols-3 gap-3">
            {PRODUCT_CARD_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => updateData("productCardPresetId", preset.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-colors",
                  data.productCardPresetId === preset.id
                    ? "border-secondary bg-secondary/5"
                    : "border-transparent bg-muted/30 hover:border-border"
                )}
              >
                <ProductCardWireframe variant={preset.id} />
                <span className="text-xs font-medium">{preset.name}</span>
                <span className="text-[10px] text-muted-foreground">{preset.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function HeaderWireframe({ variant }: { variant: string }) {
  if (variant === "dark") {
    return (
      <div className="flex h-10 w-full items-center gap-1 rounded border bg-slate-800 px-2">
        <div className="h-2 w-4 rounded-sm bg-white/60" />
        <div className="flex-1" />
        <div className="h-1 w-3 rounded-full bg-white/30" />
        <div className="h-1 w-3 rounded-full bg-white/30" />
        <div className="h-1 w-3 rounded-full bg-white/30" />
        <div className="flex-1" />
        <div className="size-2 rounded-full bg-white/30" />
      </div>
    )
  }
  if (variant === "minimal") {
    return (
      <div className="flex h-10 w-full items-center gap-1 rounded border bg-background px-2">
        <div className="h-2 w-4 rounded-sm bg-primary" />
        <div className="flex-1" />
        <div className="h-1 w-3 rounded-full bg-foreground/10" />
        <div className="h-1 w-3 rounded-full bg-foreground/10" />
      </div>
    )
  }
  return (
    <div className="flex h-10 w-full items-center gap-1 rounded border bg-background px-2">
      <div className="h-2 w-4 rounded-sm bg-primary" />
      <div className="flex-1" />
      <div className="h-1 w-3 rounded-full bg-foreground/10" />
      <div className="h-1 w-3 rounded-full bg-foreground/10" />
      <div className="h-1 w-3 rounded-full bg-foreground/10" />
      <div className="flex-1" />
      <div className="size-2 rounded-full border bg-muted" />
      <div className="size-2 rounded-full border bg-muted" />
    </div>
  )
}

function FooterWireframe({ variant }: { variant: string }) {
  if (variant === "two-col") {
    return (
      <div className="flex h-12 w-full flex-col rounded border bg-background p-1.5">
        <div className="grid flex-1 grid-cols-2 gap-1">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="h-1 w-4 rounded-full bg-foreground/15" />
              <div className="h-1 w-6 rounded-full bg-muted" />
              <div className="h-1 w-5 rounded-full bg-muted" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center border-t pt-0.5">
          <div className="h-1 w-10 rounded-full bg-muted" />
        </div>
      </div>
    )
  }
  if (variant === "dark") {
    return (
      <div className="flex h-12 w-full flex-col items-center justify-center gap-1.5 rounded border bg-slate-800 p-1.5">
        <div className="flex gap-1.5">
          <div className="h-1 w-4 rounded-full bg-white/30" />
          <div className="h-1 w-4 rounded-full bg-white/30" />
          <div className="h-1 w-4 rounded-full bg-white/30" />
        </div>
        <div className="h-1 w-16 rounded-full bg-white/20" />
      </div>
    )
  }
  return (
    <div className="flex h-12 w-full flex-col rounded border bg-background p-1.5">
      <div className="grid flex-1 grid-cols-3 gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className="h-1 w-3 rounded-full bg-foreground/15" />
            <div className="h-1 w-5 rounded-full bg-muted" />
            <div className="h-1 w-4 rounded-full bg-muted" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center border-t pt-0.5">
        <div className="h-1 w-10 rounded-full bg-muted" />
      </div>
    </div>
  )
}

function ProductCardWireframe({ variant }: { variant: string }) {
  if (variant === "storefront") {
    return (
      <div className="w-16 overflow-hidden rounded-lg border bg-background">
        <div className="h-10 bg-muted" />
        <div className="space-y-1 p-1">
          <div className="h-1 w-3/4 rounded-full bg-foreground/10" />
          <div className="h-1 w-1/2 rounded-full bg-primary/40" />
          <div className="mx-auto mt-1 h-2 w-full rounded bg-primary/20" />
        </div>
      </div>
    )
  }
  if (variant === "minimal") {
    return (
      <div className="w-16 overflow-hidden rounded-lg border bg-background">
        <div className="h-10 bg-muted" />
        <div className="space-y-1 p-1">
          <div className="h-1 w-3/4 rounded-full bg-foreground/10" />
          <div className="h-1 w-1/2 rounded-full bg-primary/40" />
        </div>
      </div>
    )
  }
  return (
    <div className="w-16 overflow-hidden rounded-lg border bg-background">
      <div className="h-10 bg-muted" />
      <div className="space-y-1 p-1">
        <div className="h-1 w-3/4 rounded-full bg-foreground/10" />
        <div className="h-1 w-full rounded-full bg-foreground/5" />
        <div className="h-1 w-1/2 rounded-full bg-primary/40" />
        <div className="mx-auto mt-0.5 h-2 w-full rounded bg-primary/20" />
        <div className="mx-auto h-2 w-full rounded bg-muted" />
      </div>
    </div>
  )
}

// ─── Step 7: Home page initial blocks ───────────────────────────────────────

function StepHomeBlocks({ data, updateData }: StepProps) {
  const toggleGeneralSection = (presetId: string) => {
    const selected = data.generalSectionIds.includes(presetId)
    if (selected) {
      updateData(
        "generalSectionIds",
        data.generalSectionIds.filter((id) => id !== presetId)
      )
      return
    }
    // Keep selection order aligned with GENERAL_PRESETS catalog order
    const next = GENERAL_PRESETS.map((preset) => preset.id).filter(
      (id) => id === presetId || data.generalSectionIds.includes(id)
    )
    updateData("generalSectionIds", next)
  }

  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold">أقسام الصفحة الرئيسية</h3>
      <p className="text-sm text-muted-foreground">
        اختر هيرو البداية والأقسام العامة التي ستُنشأ بمحتوى أولي. شبكة المنتجات
        تُضاف تلقائياً حسب بطاقة المنتج من خطوة التخطيط. صفحات السلة وتسجيل
        الدخول والتحقق تُنشأ تلقائياً.
      </p>

      <div className="space-y-6 pt-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Layers className="size-4 text-secondary" /> قسم الهيرو
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {HERO_PRESETS.map((preset) => {
              const selected = data.heroPresetId === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => updateData("heroPresetId", preset.id)}
                  className={cn(
                    "overflow-hidden rounded-xl border-2 text-start transition-colors",
                    selected
                      ? "border-secondary bg-secondary/5"
                      : "border-transparent bg-muted/30 hover:border-border"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      preset.previewImage ??
                      "https://placehold.co/480x270/e2e8f0/64748b?text=Hero"
                    }
                    alt=""
                    className="aspect-[16/9] w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-2 p-3">
                    <span className="text-xs font-medium">{preset.title}</span>
                    {selected ? (
                      <Check className="size-4 shrink-0 text-secondary" />
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Layers className="size-4 text-secondary" /> الأقسام العامة
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            يمكن اختيار أكثر من قسم. سيظهر كل قسم بمحتواه الافتراضي على الصفحة
            الرئيسية.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {GENERAL_PRESETS.map((preset) => {
              const selected = data.generalSectionIds.includes(preset.id)
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => toggleGeneralSection(preset.id)}
                  className={cn(
                    "overflow-hidden rounded-xl border-2 text-start transition-colors",
                    selected
                      ? "border-secondary bg-secondary/5"
                      : "border-transparent bg-muted/30 hover:border-border"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      preset.previewImage ??
                      "https://placehold.co/480x270/e2e8f0/64748b?text=Section"
                    }
                    alt=""
                    className="aspect-[16/9] w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-2 p-3">
                    <span className="text-xs font-medium">{preset.title}</span>
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded border",
                        selected
                          ? "border-secondary bg-secondary text-secondary-foreground"
                          : "border-border bg-background"
                      )}
                    >
                      {selected ? <Check className="size-3" /> : null}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border bg-muted/20 p-4">
          <p className="text-sm font-medium">صفحات القالب الافتراضية</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>/ — الرئيسية (هيرو + الأقسام المختارة + شبكة المنتجات)</li>
            <li>/cart — السلة (قالب السلة)</li>
            <li>/login — تسجيل الدخول (نموذج الدخول)</li>
            <li>/verify-otp — التحقق من الرمز (نموذج OTP)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ─── Step 8: Preview ────────────────────────────────────────────────────────

function StepPreview({ data }: { data: OnboardingState }) {
  const palette = (COLOR_PALETTES.find((p) => p.id === data.paletteId) ?? COLOR_PALETTES[0])!
  const fontPreset = (FONT_PRESETS.find((f) => f.id === data.fontPresetId) ?? FONT_PRESETS[0])!
  const primaryColor = palette.colors.primary
  const surfaceColor = palette.colors.surface
  const btnRadius = BUTTON_SHAPES.find((s) => s.id === data.buttonShapeId)?.radius ?? "8px"

  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold">معاينة القالب</h3>
      <p className="text-sm text-muted-foreground">
        هذا شكل متجرك بناءً على اختياراتك. يمكنك الرجوع لتعديل أي خطوة.
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border">
        {/* Browser chrome */}
        <div className="flex h-7 items-center gap-1.5 px-3" style={{ backgroundColor: primaryColor }}>
          <span className="size-1.5 rounded-full bg-white/25" />
          <span className="size-1.5 rounded-full bg-white/25" />
          <span className="size-1.5 rounded-full bg-white/25" />
          <div className="mx-4 h-3.5 flex-1 rounded bg-white/10" />
        </div>

        {/* Page */}
        <div style={{ backgroundColor: surfaceColor }}>
          {/* Header */}
          <div
            className="flex h-9 items-center border-b px-3"
            style={{
              backgroundColor: HEADER_PRESETS.find((h) => h.id === data.headerPresetId)?.backgroundColor || "#ffffff",
              color: HEADER_PRESETS.find((h) => h.id === data.headerPresetId)?.textColor || undefined,
            }}
          >
            <div className="h-2.5 w-5 rounded-sm" style={{ backgroundColor: primaryColor }} />
            <div className="flex flex-1 justify-center gap-2">
              <div className="h-1 w-5 rounded-full bg-current opacity-20" />
              <div className="h-1 w-5 rounded-full bg-current opacity-20" />
              <div className="h-1 w-5 rounded-full bg-current opacity-20" />
            </div>
            <div className="size-3 rounded-full border opacity-40" />
          </div>

          {/* Hero */}
          <div
            className="flex h-20 flex-col items-center justify-center gap-1.5"
            style={{ background: `linear-gradient(135deg, ${primaryColor}12, ${surfaceColor})` }}
          >
            <div className="h-1.5 w-24 rounded-full bg-foreground/10" />
            <div className="h-1 w-14 rounded-full bg-foreground/7" />
            <div
              className="mt-1 h-3 w-12 text-white"
              style={{ backgroundColor: primaryColor, borderRadius: btnRadius }}
            />
          </div>

          {/* Products */}
          <div className="grid grid-cols-4 gap-2 p-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-lg border bg-white/60">
                <div className="h-9 bg-muted" />
                <div className="space-y-1 p-1.5">
                  <div className="h-1 w-3/4 rounded-full bg-foreground/10" />
                  <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: `${primaryColor}40` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            className="flex h-6 items-center justify-center border-t"
            style={{
              backgroundColor: FOOTER_PRESETS.find((f) => f.id === data.footerPresetId)?.backgroundColor || undefined,
            }}
          >
            <div className="h-1 w-12 rounded-full bg-foreground/5" />
          </div>
        </div>
      </div>

      {/* Summary chips */}
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5">
          <Palette className="size-4 text-secondary" />
          <div>
            <p className="text-[10px] text-muted-foreground">لوحة الألوان</p>
            <p className="text-xs font-medium">{palette.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5">
          <Type className="size-4 text-secondary" />
          <div>
            <p className="text-[10px] text-muted-foreground">الخطوط</p>
            <p className="text-xs font-medium">{fontPreset.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5">
          <Ruler className="size-4 text-secondary" />
          <div>
            <p className="text-[10px] text-muted-foreground">الأحجام</p>
            <p className="text-xs font-medium">
              {SIZING_PRESETS.find((s) => s.id === data.sizingId)?.name ?? "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5">
          <Layers className="size-4 text-secondary" />
          <div>
            <p className="text-[10px] text-muted-foreground">أقسام الرئيسية</p>
            <p className="text-xs font-medium">
              هيرو + {data.generalSectionIds.length} عام + منتجات
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
        الصفحات: / · /cart · /login · /verify-otp
      </div>
    </div>
  )
}
