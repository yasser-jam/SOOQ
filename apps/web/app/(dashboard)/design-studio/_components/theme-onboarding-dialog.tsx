"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  ImagePlus,
  Loader2,
  Sparkles,
  X,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

import {
  ARABIC_FONT_OPTIONS,
  COLOR_KEYS,
  DEFAULT_COLORS,
  DEFAULT_SCALES,
  DEFAULT_SHELL,
  FONT_OPTIONS,
  ensureGoogleFontsLoaded,
  type BadgeShape,
  type BadgeStyle,
  type ButtonVariantKey,
  type ColorKey,
  type ColorTheme,
  type FullThemeProps,
  type ScaleThemeProps,
} from "@/core/config/theme"
import {
  normalizeSiteData,
  type SiteData,
  type SitePage,
} from "@/core/config/lib/site-data"
import {
  FALLBACK_THEME_NAME,
  writeSelectedTheme,
} from "@/core/config/lib/selected-theme"
import { builtinThemeCatalog, loadBuiltinThemeSiteData } from "@/core/themes"
import { DEFAULT_HEADER_LINKS, type HeaderLink } from "@/core/config/components/Header"
import { DEFAULT_FOOTER_COLUMNS, type FooterColumn } from "@/core/config/components/Footer"
import { createProductDetailSection } from "@/core/config/presets/products-grid"
import { createProductsPagePresetContent } from "@/core/config/presets/products-page"
import {
  createCancelOrderZonePopup,
  createCartPageContent,
  createCheckoutPageContent,
  createOrderDetailPageContent,
  createOrdersPageContent,
  createSettingsPageContent,
  FORMS_PRESETS,
  GENERAL_PRESETS,
  HERO_PRESETS,
  type SectionPreset,
} from "@/core/config/presets"
import { ROOT_ZONE_POPUP } from "@/core/config/shell-zones"
import { buildStudioEditHref } from "@/lib/design-studio-paths"
import {
  DESIGN_SCHEMA_VERSION,
  createBlankDraft,
  saveDesignDraft,
} from "@/modules/design-studio/actions"
import { applyDesignConfigToLocalStorage } from "@/modules/design-studio/local-site-sync"
import { designStudioKeys } from "@/modules/design-studio/queryKeys"
import { CUSTOM_TEMPLATE_KEY } from "@/modules/design-studio/templates"

// ─── Steps ──────────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    label: "الهوية والاسم",
    title: "هوية الثيم",
    hint: "ابدأ باسم الثيم وصورة غلاف تمثله في معرض القوالب.",
  },
  {
    id: 2,
    label: "الألوان",
    title: "توكنات الألوان",
    hint: "اختر لوحة جاهزة ثم عدّل أي توكن على حدة.",
  },
  {
    id: 3,
    label: "الخطوط",
    title: "نظام الخطوط",
    hint: "ثلاثة خطوط: العناوين، النصوص، والعناصر المساندة — مع مقياس نصي موحّد.",
  },
  {
    id: 4,
    label: "الأزرار",
    title: "أنماط الأزرار",
    hint: "ثلاثة أنماط رئيسية. اربط لون كل نمط بتوكن من الثيم أو حدده يدوياً.",
  },
  {
    id: 5,
    label: "القياسات",
    title: "الاستدارة والشارات",
    hint: "القياسات العامة التي تُطبق على كل مكونات المتجر.",
  },
  {
    id: 6,
    label: "الرأس والتذييل",
    title: "مكونات التخطيط",
    hint: "اختر شكل الرأس والتذييل من المجموعات الجاهزة.",
  },
  {
    id: 7,
    label: "بطاقة المنتج",
    title: "شكل بطاقة المنتج",
    hint: "صورة، عنوان، سعر، وأزرار الإجراء — اختر التوزيع الذي يناسب متجرك.",
  },
  {
    id: 8,
    label: "أقسام الرئيسية",
    title: "أقسام الصفحة الرئيسية",
    hint: "حدد الأقسام التي تظهر في الرئيسية. رتّبها لاحقاً من المحرر.",
  },
] as const

const TOTAL_STEPS = STEPS.length

// ─── Base template ("ابدأ من") ──────────────────────────────────────────────

const BLANK_BASE_KEY = "blank"

const BASE_OPTIONS: { id: string; label: string }[] = [
  { id: BLANK_BASE_KEY, label: "من الصفر" },
  ...builtinThemeCatalog.map((theme) => ({
    id: theme.templateKey,
    label: `نسخة من ${theme.templateName}`,
  })),
]

// ─── Color palettes (mapped to real ColorTheme) ─────────────────────────────

type ColorPaletteOption = {
  id: string
  name: string
  colors: ColorTheme
}

/** Swatch row shown on a palette card — brand-forward keys first. */
const PALETTE_SWATCH_KEYS: ColorKey[] = ["primary", "dark", "neutral", "surface"]

const COLOR_PALETTES: ColorPaletteOption[] = [
  {
    id: "default-blue",
    name: "أزرق احترافي",
    colors: { ...DEFAULT_COLORS },
  },
  {
    id: "classic-dark",
    name: "كلاسيكي داكن",
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

const CUSTOM_PALETTE_ID = "custom"

const COLOR_TOKEN_LABELS: Record<ColorKey, string> = {
  primary: "الأساسي",
  surface: "الخلفية",
  text: "النص",
  neutral: "المحايد والحدود",
  dark: "الداكن",
  success: "النجاح",
  warning: "التنبيه",
  error: "الخطأ",
}

/** Each editable colour + the CSS custom property it ends up as. */
const COLOR_TOKENS = COLOR_KEYS.map(({ key }) => ({
  key,
  label: COLOR_TOKEN_LABELS[key],
  token: `--theme-color-${key}`,
}))

// ─── Font slots ─────────────────────────────────────────────────────────────

type FontSlotKey = "fontOption1" | "bodyFont" | "fontOption2"

const FONT_SLOTS: {
  key: FontSlotKey
  role: string
  usage: string
  colorKey: ColorKey
}[] = [
  { key: "fontOption1", role: "الأول", usage: "العناوين", colorKey: "text" },
  { key: "bodyFont", role: "الثاني", usage: "النصوص", colorKey: "neutral" },
  { key: "fontOption2", role: "الثالث", usage: "الأسعار والشارات", colorKey: "primary" },
]

const FONT_PRESET_BUNDLES: {
  id: string
  name: string
  fonts: Record<FontSlotKey, string>
}[] = [
  {
    id: "classic",
    name: "القاهرة الكلاسيكي",
    fonts: { fontOption1: "tajawal", bodyFont: "cairo", fontOption2: "almarai" },
  },
  {
    id: "modern",
    name: "عصري نظيف",
    fonts: { fontOption1: "readex-pro", bodyFont: "tajawal", fontOption2: "cairo" },
  },
  {
    id: "elegant",
    name: "أنيق كلاسيكي",
    fonts: {
      fontOption1: "el-messiri",
      bodyFont: "amiri",
      fontOption2: "noto-naskh-arabic",
    },
  },
  {
    id: "tech",
    name: "تقني حديث",
    fonts: {
      fontOption1: "rubik",
      bodyFont: "readex-pro",
      fontOption2: "ibm-plex-sans-arabic",
    },
  },
]

// ─── Text scale presets (mapped to ScaleThemeProps) ─────────────────────────

type TextScalePreset = {
  id: string
  name: string
  description: string
  scales: Partial<ScaleThemeProps>
}

const TEXT_SCALE_PRESETS: TextScalePreset[] = [
  {
    id: "compact",
    name: "مضغوط",
    description: "نصوص أصغر وأزرار منخفضة",
    scales: {
      textSizeSm: "0.8125rem",
      textSizeMd: "0.9375rem",
      textSizeLg: "1.0625rem",
      textSizeXl: "1.25rem",
      textSize2xl: "1.5rem",
      buttonSmHeight: "30px",
      buttonMdHeight: "38px",
      buttonLgHeight: "46px",
    },
  },
  {
    id: "balanced",
    name: "متوازن",
    description: "المقياس الافتراضي للمتجر",
    scales: {},
  },
  {
    id: "spacious",
    name: "واسع",
    description: "نصوص أكبر وتنفّس بصري",
    scales: {
      textSizeMd: "1.0625rem",
      textSizeLg: "1.3125rem",
      textSizeXl: "1.5rem",
      textSize2xl: "2rem",
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
    description: "مساحات سخية وإحساس راقٍ",
    scales: {
      textSizeMd: "1.125rem",
      textSizeLg: "1.375rem",
      textSizeXl: "1.625rem",
      textSize2xl: "2.25rem",
      buttonSmHeight: "40px",
      buttonMdHeight: "52px",
      buttonLgHeight: "62px",
      buttonSmPaddingX: "18px",
      buttonMdPaddingX: "26px",
      buttonLgPaddingX: "34px",
    },
  },
]

const TEXT_SIZE_STEPS: { key: string; prop: keyof ScaleThemeProps }[] = [
  { key: "sm", prop: "textSizeSm" },
  { key: "md", prop: "textSizeMd" },
  { key: "lg", prop: "textSizeLg" },
  { key: "xl", prop: "textSizeXl" },
  { key: "2xl", prop: "textSize2xl" },
]

// ─── Button variants ────────────────────────────────────────────────────────

type ButtonColorSource = "primary" | "neutral" | "error" | "manual"

const BUTTON_COLOR_SOURCES: { id: ButtonColorSource; label: string }[] = [
  { id: "primary", label: "الأساسي" },
  { id: "neutral", label: "المحايد" },
  { id: "error", label: "الخطأ" },
  { id: "manual", label: "يدوي" },
]

const BUTTON_VARIANTS: { key: ButtonVariantKey; name: string; usage: string }[] = [
  { key: "primary", name: "ممتلئ", usage: "الإجراء الرئيسي — أضف إلى السلة" },
  { key: "secondary", name: "ثانوي", usage: "الإجراءات المساندة" },
  { key: "error", name: "تحذيري", usage: "الحذف والإلغاء" },
]

// ─── Radius presets (mapped to ScaleThemeProps) ─────────────────────────────

type RadiusPreset = {
  id: string
  name: string
  /** Applied to the shared radius scale */
  scales: Partial<ScaleThemeProps>
  /** Applied to every button variant */
  buttonRadius: string
}

const RADIUS_PRESETS: RadiusPreset[] = [
  {
    id: "sharp",
    name: "حاد",
    scales: { radiusSm: "0px", radiusMd: "0px", radiusLg: "0px", radiusXl: "0px" },
    buttonRadius: "0px",
  },
  {
    id: "soft",
    name: "ناعم",
    scales: { radiusSm: "6px", radiusMd: "10px", radiusLg: "14px", radiusXl: "18px" },
    buttonRadius: "8px",
  },
  {
    id: "rounded",
    name: "مدوّر",
    scales: { radiusSm: "10px", radiusMd: "16px", radiusLg: "22px", radiusXl: "28px" },
    buttonRadius: "14px",
  },
  {
    id: "pill",
    name: "كبسولة",
    scales: { radiusSm: "12px", radiusMd: "20px", radiusLg: "28px", radiusXl: "36px" },
    buttonRadius: "9999px",
  },
]

const RADIUS_STEPS: { key: string; prop: keyof ScaleThemeProps }[] = [
  { key: "sm", prop: "radiusSm" },
  { key: "md", prop: "radiusMd" },
  { key: "lg", prop: "radiusLg" },
]

const BADGE_SHAPES: { id: BadgeShape; name: string; radius: string }[] = [
  { id: "square", name: "مربع", radius: "2px" },
  { id: "rounded", name: "مدوّر", radius: "8px" },
  { id: "pill", name: "كبسولة", radius: "9999px" },
]

const BADGE_STYLES: { id: BadgeStyle; name: string }[] = [
  { id: "solid", name: "ممتلئ" },
  { id: "outline", name: "محدد" },
  { id: "soft", name: "ناعم" },
]

// ─── Header / footer presets ────────────────────────────────────────────────

type HeaderPreset = {
  id: string
  name: string
  description: string
  links: HeaderLink[]
  backgroundColor: string
  textColor: string
}

const HEADER_PRESETS: HeaderPreset[] = [
  {
    id: "default",
    name: "شعار + قائمة",
    description: "شعار يميناً وروابط بجانبه مع أيقونات الحساب والسلة.",
    links: DEFAULT_HEADER_LINKS,
    backgroundColor: "",
    textColor: "",
  },
  {
    id: "dark",
    name: "رأس داكن",
    description: "نفس التوزيع بخلفية داكنة ونص فاتح.",
    links: DEFAULT_HEADER_LINKS,
    backgroundColor: "#1a1a2e",
    textColor: "#ffffff",
  },
  {
    id: "minimal",
    name: "بسيط",
    description: "رابطان فقط — مناسب للمتاجر أحادية المجموعة.",
    links: [
      { label: "Home", labelAr: "الرئيسية", link: { kind: "page", pageId: "/" } },
      {
        label: "Shop",
        labelAr: "المتجر",
        link: { kind: "page", pageId: "/products/example-product" },
      },
    ],
    backgroundColor: "",
    textColor: "",
  },
]

type FooterPreset = {
  id: string
  name: string
  description: string
  columns: FooterColumn[]
  tagline: string
  taglineAr: string
  backgroundColor: string
  textColor: string
}

const FOOTER_PRESETS: FooterPreset[] = [
  {
    id: "three-col",
    name: "ثلاثة أعمدة",
    description: "روابط مقسمة مع حقوق النشر.",
    columns: DEFAULT_FOOTER_COLUMNS,
    tagline: "",
    taglineAr: "",
    backgroundColor: "",
    textColor: "",
  },
  {
    id: "two-col",
    name: "عمودان",
    description: "تقسيم أخف للمتاجر الصغيرة.",
    columns: DEFAULT_FOOTER_COLUMNS.slice(0, 2),
    tagline: "",
    taglineAr: "",
    backgroundColor: "",
    textColor: "",
  },
  {
    id: "dark",
    name: "داكن مبسّط",
    description: "صف واحد للروابط على خلفية داكنة.",
    columns: [
      {
        title: "Links",
        titleAr: "روابط",
        links: [
          { label: "Home", labelAr: "الرئيسية", link: { kind: "page", pageId: "/" } },
          {
            label: "Shop",
            labelAr: "المتجر",
            link: { kind: "page", pageId: "/products/example-product" },
          },
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

// ─── Product card presets ───────────────────────────────────────────────────

type ProductCardPreset = {
  id: string
  name: string
  description: string
  /** Live-preview shape flags */
  showDescription: boolean
  showDetailsButton: boolean
}

const PRODUCT_CARD_PRESETS: ProductCardPreset[] = [
  {
    id: "full",
    name: "عمودي كامل",
    description: "صورة + وصف + سعر + إضافة للسلة + عرض التفاصيل.",
    showDescription: true,
    showDetailsButton: true,
  },
  {
    id: "storefront",
    name: "واجهة المتجر",
    description: "صورة + عنوان + سعر + زر التفاصيل.",
    showDescription: false,
    showDetailsButton: true,
  },
  {
    id: "minimal",
    name: "بسيطة",
    description: "صورة + عنوان + سعر فقط — مظهر هادئ ونظيف.",
    showDescription: false,
    showDetailsButton: false,
  },
]

// ─── Wizard state ───────────────────────────────────────────────────────────

type WizardState = {
  themeName: string
  themeDescription: string
  coverImage: File | null
  baseKey: string
  paletteId: string
  colors: ColorTheme
  fonts: Record<FontSlotKey, string>
  textScaleId: string
  buttonSources: Record<ButtonVariantKey, ButtonColorSource>
  buttonManualColors: Record<ButtonVariantKey, string>
  radiusId: string
  badgeShape: BadgeShape
  badgeStyle: BadgeStyle
  headerPresetId: string
  footerPresetId: string
  productCardPresetId: string
  heroPresetId: string
  generalSectionIds: string[]
}

const DEFAULT_HERO_PRESET_ID = HERO_PRESETS[0]?.id ?? "hero-bg-image"

const INITIAL_STATE: WizardState = {
  themeName: "",
  themeDescription: "",
  coverImage: null,
  baseKey: BLANK_BASE_KEY,
  paletteId: "default-blue",
  colors: { ...DEFAULT_COLORS },
  fonts: FONT_PRESET_BUNDLES[0]!.fonts,
  textScaleId: "balanced",
  buttonSources: { primary: "primary", secondary: "neutral", error: "error" },
  buttonManualColors: { primary: "#0b78c5", secondary: "#64748b", error: "#c24133" },
  radiusId: "soft",
  badgeShape: "rounded",
  badgeStyle: "solid",
  headerPresetId: "default",
  footerPresetId: "three-col",
  productCardPresetId: "full",
  heroPresetId: DEFAULT_HERO_PRESET_ID,
  generalSectionIds: GENERAL_PRESETS.map((preset) => preset.id),
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
  const queryClient = useQueryClient()

  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<WizardState>(INITIAL_STATE)
  const [previewPreset, setPreviewPreset] = useState<SectionPreset | null>(null)

  const update = useCallback(
    <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
      setData((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const step = STEPS[currentStep - 1]!
  const usesBaseTemplate = data.baseKey !== BLANK_BASE_KEY

  const createDraftMutation = useMutation({
    mutationFn: async () => {
      const themeName = data.themeName.trim() || FALLBACK_THEME_NAME
      const siteData = normalizeSiteData(await buildSiteDataFromState(data))

      // `PUT /admin/design/draft` is update-only (404 on a tenant that never
      // had a draft — the first-run case this wizard exists for). Create the
      // blank draft row on 404, then retry the save with the wizard's config.
      const draftInput = {
        configJson: {
          web: siteData,
          mobile: {},
          templateKey: CUSTOM_TEMPLATE_KEY,
        },
        schemaVersion: DESIGN_SCHEMA_VERSION,
      }

      let version
      try {
        version = await saveDesignDraft(draftInput)
      } catch (err) {
        if ((err as { status?: number })?.status !== 404) throw err
        await createBlankDraft()
        version = await saveDesignDraft(draftInput)
      }

      // Keep editor localStorage in lockstep with the new API draft.
      applyDesignConfigToLocalStorage(version.configJson)

      return { version, themeName }
    },
    onSuccess: async ({ themeName }) => {
      writeSelectedTheme({
        templateKey: CUSTOM_TEMPLATE_KEY,
        name: themeName,
        previewImageUrl: null,
      })
      await queryClient.invalidateQueries({ queryKey: designStudioKeys.all })

      onOpenChange(false)
      setCurrentStep(1)

      router.push(buildStudioEditHref("/design-studio", themeName))
    },
    onError: () => {
      toast.error("تعذر حفظ الثيم المخصص. حاول مرة أخرى.")
    },
  })

  const goNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1)
      return
    }
    createDraftMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        showCloseButton={false}
        className="h-[min(720px,90vh)] max-w-[1080px] gap-0 overflow-hidden rounded-[22px] p-0 sm:max-w-[1080px]"
      >
        <DialogTitle className="sr-only">إنشاء ثيم جديد</DialogTitle>
        <DialogDescription className="sr-only">
          معالج من ثماني خطوات لبناء ثيم مخصص لمتجرك.
        </DialogDescription>

        <div className="flex h-full min-h-0">
          <StepRail currentStep={currentStep} onSelect={setCurrentStep} />

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Panel header */}
            <header className="flex items-start justify-between gap-4 border-b px-8 pb-5 pt-7">
              <div className="min-w-0">
                <h3 className="text-xl font-extrabold">{step.title}</h3>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {step.hint}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="size-9 shrink-0"
                onClick={() => onOpenChange(false)}
                aria-label="إغلاق"
              >
                <X className="size-4" />
              </Button>
            </header>

            {/* Panel body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
              {currentStep === 1 && <StepIdentity data={data} update={update} />}
              {currentStep === 2 && <StepColors data={data} update={update} />}
              {currentStep === 3 && <StepTypography data={data} update={update} />}
              {currentStep === 4 && <StepButtons data={data} update={update} />}
              {currentStep === 5 && <StepMetrics data={data} update={update} />}
              {currentStep === 6 && <StepLayout data={data} update={update} />}
              {currentStep === 7 && <StepProductCard data={data} update={update} />}
              {currentStep === 8 && (
                <StepHomeSections
                  data={data}
                  update={update}
                  locked={usesBaseTemplate}
                  onPreview={setPreviewPreset}
                />
              )}
            </div>

            {/* Panel footer */}
            <footer className="flex items-center justify-between gap-3 border-t bg-muted/30 px-8 py-4">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                  disabled={currentStep === 1}
                >
                  <ChevronRight data-icon="inline-start" className="size-4" />
                  السابق
                </Button>
                <Button
                  variant="secondary"
                  onClick={goNext}
                  disabled={createDraftMutation.isPending}
                >
                  {currentStep === TOTAL_STEPS ? (
                    <>
                      {createDraftMutation.isPending ? (
                        <Loader2
                          data-icon="inline-start"
                          className="size-4 animate-spin"
                        />
                      ) : (
                        <Sparkles data-icon="inline-start" className="size-4" />
                      )}
                      إنشاء الثيم
                    </>
                  ) : (
                    <>
                      التالي
                      <ChevronLeft data-icon="inline-end" className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </footer>
          </div>
        </div>
      </DialogContent>

      <SectionPreviewDialog
        preset={previewPreset}
        selected={
          previewPreset
            ? previewPreset.category === "hero"
              ? data.heroPresetId === previewPreset.id
              : data.generalSectionIds.includes(previewPreset.id)
            : false
        }
        onToggle={(preset) => {
          if (preset.category === "hero") {
            update("heroPresetId", preset.id)
            return
          }
          toggleGeneralSection(data, update, preset.id)
        }}
        onClose={() => setPreviewPreset(null)}
      />
    </Dialog>
  )
}

// ─── Step rail ──────────────────────────────────────────────────────────────

function StepRail({
  currentStep,
  onSelect,
}: {
  currentStep: number
  onSelect: (step: number) => void
}) {
  const progressPct = Math.round((currentStep / TOTAL_STEPS) * 100)

  return (
    <aside className="flex w-[270px] shrink-0 flex-col gap-5 overflow-y-auto border-e bg-muted/40 px-5 py-7">
      <div>
        <p className="text-xs font-bold tracking-wide text-secondary">ثيم جديد</p>
        <h2 className="mt-1.5 text-lg font-extrabold">خطوات الإنشاء</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          الخطوة {currentStep} من {TOTAL_STEPS}
        </p>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-secondary transition-[width]"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <nav className="flex flex-col gap-1">
        {STEPS.map((s) => {
          const active = s.id === currentStep
          const done = s.id < currentStep
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-start transition-colors",
                active
                  ? "border-secondary/40 bg-background shadow-sm"
                  : "border-transparent hover:bg-background/60"
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold",
                  done
                    ? "bg-emerald-600 text-white"
                    : active
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-border text-muted-foreground"
                )}
              >
                {done ? <Check className="size-3.5" /> : s.id}
              </span>
              <span
                className={cn(
                  "truncate text-sm",
                  active
                    ? "font-extrabold text-foreground"
                    : done
                      ? "font-semibold text-muted-foreground"
                      : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

// ─── Shared primitives ──────────────────────────────────────────────────────

type StepProps = {
  data: WizardState
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-bold text-foreground/80">{children}</span>
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-[13px] font-bold transition-colors",
        selected
          ? "border-secondary bg-secondary text-secondary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-secondary/40"
      )}
    >
      {children}
    </button>
  )
}

function SelectCard({
  selected,
  onClick,
  className,
  children,
}: {
  selected: boolean
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl bg-muted/30 p-3.5 text-start transition-colors",
        selected
          ? "border-2 border-secondary shadow-[0_2px_10px_color-mix(in_srgb,var(--secondary)_18%,transparent)]"
          : "border border-border hover:border-secondary/40",
        className
      )}
    >
      {children}
    </button>
  )
}

/** Small token/value pill — LTR-isolated inside the RTL copy. */
function ValuePill({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1.5 rounded-lg border bg-background px-3 py-2">
      <span className="text-xs font-bold text-foreground/70" dir="ltr">
        {label}
      </span>
      <span className="text-xs text-muted-foreground" dir="ltr">
        {value}
      </span>
    </span>
  )
}

// ─── Step 1: Identity ───────────────────────────────────────────────────────

function StepIdentity({ data, update }: StepProps) {
  const coverUrl = useObjectUrl(data.coverImage)

  return (
    <div className="flex flex-wrap gap-7">
      <div className="flex w-60 shrink-0 flex-col gap-2.5">
        <Label>صورة الثيم</Label>
        <label className="flex h-50 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-muted/30 text-muted-foreground transition-colors hover:border-secondary hover:bg-secondary/5">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-center">
              <ImagePlus className="size-7" />
              <span className="text-xs">أضف صورة غلاف</span>
            </span>
          )}
          <input
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => update("coverImage", e.target.files?.[0] ?? null)}
          />
        </label>
        <p className="text-xs leading-relaxed text-muted-foreground">
          نسبة 4:3 · تظهر في معرض القوالب. تُعاين محلياً حتى تفعيل رفع الصور.
        </p>
      </div>

      <div className="flex min-w-[280px] flex-1 flex-col gap-5">
        <div className="space-y-2">
          <Label htmlFor="theme-name">اسم الثيم</Label>
          <Input
            id="theme-name"
            value={data.themeName}
            onChange={(e) => update("themeName", e.target.value)}
            placeholder="مثال: واحة"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme-desc">وصف قصير</Label>
          <Textarea
            id="theme-desc"
            className="min-h-24"
            value={data.themeDescription}
            onChange={(e) => update("themeDescription", e.target.value)}
            placeholder="اتجاه بصري دافئ للمتاجر العربية…"
          />
        </div>

        <div className="space-y-2.5">
          <Label>ابدأ من</Label>
          <div className="flex flex-wrap gap-2.5">
            {BASE_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                selected={data.baseKey === option.id}
                onClick={() => update("baseKey", option.id)}
              >
                {option.label}
              </Chip>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {data.baseKey === BLANK_BASE_KEY
              ? "تُبنى الصفحات من الأقسام التي تختارها في الخطوة الأخيرة."
              : "ستُنسخ صفحات القالب المختار كما هي، وتُطبَّق اختياراتك في الألوان والخطوط والقياسات فوقها."}
          </p>
        </div>
      </div>
    </div>
  )
}

/** Object URL for a picked file, revoked when the file changes or unmounts. */
function useObjectUrl(file: File | null): string | null {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    if (!url) return
    return () => URL.revokeObjectURL(url)
  }, [url])

  return url
}

// ─── Step 2: Colors ─────────────────────────────────────────────────────────

function StepColors({ data, update }: StepProps) {
  const applyPalette = (palette: ColorPaletteOption) => {
    update("paletteId", palette.id)
    update("colors", { ...palette.colors })
  }

  const setToken = (key: ColorKey, value: string) => {
    update("paletteId", CUSTOM_PALETTE_ID)
    update("colors", { ...data.colors, [key]: value })
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <SectionLabel>لوحة جاهزة</SectionLabel>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
          {COLOR_PALETTES.map((palette) => (
            <SelectCard
              key={palette.id}
              selected={data.paletteId === palette.id}
              onClick={() => applyPalette(palette)}
            >
              <div className="flex gap-1.5">
                {PALETTE_SWATCH_KEYS.map((key) => (
                  <span
                    key={key}
                    className="size-6 rounded-lg border border-foreground/10"
                    style={{ backgroundColor: palette.colors[key] }}
                  />
                ))}
              </div>
              <span className="text-[13px] font-bold">{palette.name}</span>
            </SelectCard>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>توكنات الألوان</SectionLabel>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-2.5">
          {COLOR_TOKENS.map((token) => (
            <label
              key={token.key}
              className="flex cursor-pointer items-center gap-3 rounded-xl border bg-muted/20 px-3.5 py-3 transition-colors hover:border-secondary/40"
            >
              <span
                className="size-8 shrink-0 rounded-lg border border-foreground/10"
                style={{ backgroundColor: data.colors[token.key] }}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[13px] font-bold">{token.label}</span>
                <span className="truncate text-xs text-muted-foreground" dir="ltr">
                  {token.token}
                </span>
              </span>
              <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                تغيير
              </span>
              <input
                type="color"
                className="sr-only"
                value={data.colors[token.key]}
                onChange={(e) => setToken(token.key, e.target.value)}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Typography ─────────────────────────────────────────────────────

function StepTypography({ data, update }: StepProps) {
  // Load every offered face so the Arabic previews render distinctly.
  useEffect(() => {
    ensureGoogleFontsLoaded(
      document,
      ARABIC_FONT_OPTIONS.map((f) => f.value)
    )
  }, [])

  const scale = useMemo(() => resolveScales(data), [data])
  const activeBundle = FONT_PRESET_BUNDLES.find((bundle) =>
    FONT_SLOTS.every((slot) => bundle.fonts[slot.key] === data.fonts[slot.key])
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <SectionLabel>مجموعات جاهزة</SectionLabel>
        <div className="flex flex-wrap gap-2.5">
          {FONT_PRESET_BUNDLES.map((bundle) => (
            <Chip
              key={bundle.id}
              selected={activeBundle?.id === bundle.id}
              onClick={() => update("fonts", { ...bundle.fonts })}
            >
              {bundle.name}
            </Chip>
          ))}
        </div>
      </div>

      {FONT_SLOTS.map((slot) => {
        const entry = FONT_OPTIONS.find((f) => f.value === data.fonts[slot.key])
        return (
          <div
            key={slot.key}
            className="flex flex-col gap-4 rounded-2xl border bg-muted/20 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
                  {slot.role}
                </span>
                <span className="text-[15px] font-bold">{slot.usage}</span>
              </div>
              <span
                className="text-lg"
                style={{
                  fontFamily: entry?.cssValue,
                  color: data.colors[slot.colorKey],
                }}
              >
                نموذج نصي — Aa 123
              </span>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">العائلة</span>
                <Select
                  value={data.fonts[slot.key]}
                  onValueChange={(value) =>
                    update("fonts", { ...data.fonts, [slot.key]: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ARABIC_FONT_OPTIONS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">اللون</span>
                <div className="flex h-9 items-center gap-2 rounded-md border bg-background px-3">
                  <span
                    className="size-4 rounded border border-foreground/10"
                    style={{ backgroundColor: data.colors[slot.colorKey] }}
                  />
                  <span className="text-[13px] font-semibold">
                    {COLOR_TOKEN_LABELS[slot.colorKey]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      <div className="flex flex-col gap-3">
        <SectionLabel>مقياس النص</SectionLabel>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          {TEXT_SCALE_PRESETS.map((preset) => (
            <SelectCard
              key={preset.id}
              selected={data.textScaleId === preset.id}
              onClick={() => update("textScaleId", preset.id)}
            >
              <span className="text-sm font-bold">{preset.name}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {preset.description}
              </span>
            </SelectCard>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {TEXT_SIZE_STEPS.map(({ key, prop }) => (
            <ValuePill key={key} label={key} value={String(scale[prop])} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Buttons ────────────────────────────────────────────────────────

function StepButtons({ data, update }: StepProps) {
  const radiusPreset = resolveRadiusPreset(data.radiusId)

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
      {BUTTON_VARIANTS.map((variant) => {
        const bg = resolveButtonColor(data, variant.key)
        return (
          <div
            key={variant.key}
            className="flex flex-col gap-4 rounded-2xl border bg-muted/20 p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-extrabold">{variant.name}</span>
              <span
                className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground"
                dir="ltr"
              >
                {variant.key}
              </span>
            </div>

            <div className="flex items-center justify-center rounded-xl bg-muted/60 p-5">
              <span
                className="px-6 py-2.5 text-sm font-bold text-white"
                style={{ backgroundColor: bg, borderRadius: radiusPreset.buttonRadius }}
              >
                زر تجريبي
              </span>
            </div>

            <p className="text-xs text-muted-foreground">{variant.usage}</p>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">مصدر اللون</span>
              <div className="flex flex-wrap gap-2">
                {BUTTON_COLOR_SOURCES.map((source) => (
                  <Chip
                    key={source.id}
                    selected={data.buttonSources[variant.key] === source.id}
                    onClick={() =>
                      update("buttonSources", {
                        ...data.buttonSources,
                        [variant.key]: source.id,
                      })
                    }
                  >
                    {source.label}
                  </Chip>
                ))}
              </div>
              {data.buttonSources[variant.key] === "manual" && (
                <input
                  type="color"
                  className="h-9 w-full cursor-pointer rounded-md border bg-background"
                  value={data.buttonManualColors[variant.key]}
                  onChange={(e) =>
                    update("buttonManualColors", {
                      ...data.buttonManualColors,
                      [variant.key]: e.target.value,
                    })
                  }
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 5: Metrics (radius + badges) ──────────────────────────────────────

function StepMetrics({ data, update }: StepProps) {
  const scale = useMemo(() => resolveScales(data), [data])

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <SectionLabel>الاستدارة</SectionLabel>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          {RADIUS_PRESETS.map((preset) => (
            <SelectCard
              key={preset.id}
              selected={data.radiusId === preset.id}
              onClick={() => update("radiusId", preset.id)}
              className="items-center"
            >
              <span
                className="h-10 w-full border bg-muted"
                style={{ borderRadius: preset.scales.radiusLg }}
              />
              <span className="text-[13px] font-bold">{preset.name}</span>
            </SelectCard>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {RADIUS_STEPS.map(({ key, prop }) => (
            <ValuePill key={key} label={key} value={String(scale[prop])} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>شكل الشارات (الخصم والمخزون)</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          {BADGE_SHAPES.map((shape) => (
            <SelectCard
              key={shape.id}
              selected={data.badgeShape === shape.id}
              onClick={() => update("badgeShape", shape.id)}
              className="items-center"
            >
              <span
                className="px-3 py-1 text-[11px] font-bold text-white"
                style={{
                  backgroundColor: data.colors.error,
                  borderRadius: shape.radius,
                }}
                dir="ltr"
              >
                -20%
              </span>
              <span className="text-[13px] font-bold">{shape.name}</span>
            </SelectCard>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>نمط الشارات</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          {BADGE_STYLES.map((style) => (
            <SelectCard
              key={style.id}
              selected={data.badgeStyle === style.id}
              onClick={() => update("badgeStyle", style.id)}
              className="items-center"
            >
              <span
                className="rounded-lg px-3 py-1 text-[11px] font-bold"
                dir="ltr"
                style={
                  style.id === "solid"
                    ? { backgroundColor: data.colors.error, color: "#fff" }
                    : style.id === "outline"
                      ? {
                          border: `1.5px solid ${data.colors.error}`,
                          color: data.colors.error,
                        }
                      : {
                          backgroundColor: `color-mix(in srgb, ${data.colors.error} 16%, white)`,
                          color: data.colors.error,
                        }
                }
              >
                -20%
              </span>
              <span className="text-[13px] font-bold">{style.name}</span>
            </SelectCard>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 6: Header / footer ────────────────────────────────────────────────

function StepLayout({ data, update }: StepProps) {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <SectionLabel>الرأس (Header)</SectionLabel>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
          {HEADER_PRESETS.map((preset) => (
            <SelectCard
              key={preset.id}
              selected={data.headerPresetId === preset.id}
              onClick={() => update("headerPresetId", preset.id)}
            >
              <HeaderWireframe variant={preset.id} accent={data.colors.primary} />
              <span className="text-[13px] font-bold">{preset.name}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {preset.description}
              </span>
            </SelectCard>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>التذييل (Footer)</SectionLabel>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
          {FOOTER_PRESETS.map((preset) => (
            <SelectCard
              key={preset.id}
              selected={data.footerPresetId === preset.id}
              onClick={() => update("footerPresetId", preset.id)}
            >
              <FooterWireframe variant={preset.id} />
              <span className="text-[13px] font-bold">{preset.name}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {preset.description}
              </span>
            </SelectCard>
          ))}
        </div>
      </div>
    </div>
  )
}

function HeaderWireframe({ variant, accent }: { variant: string; accent: string }) {
  const dark = variant === "dark"
  const line = dark ? "bg-white/30" : "bg-foreground/10"

  return (
    <div
      className={cn(
        "flex h-11 items-center gap-1.5 rounded-lg border px-2.5",
        dark ? "border-transparent bg-slate-800" : "bg-background"
      )}
    >
      <span
        className="h-2.5 w-6 rounded-sm"
        style={{ backgroundColor: dark ? "#ffffff99" : accent }}
      />
      <span className="flex-1" />
      <span className={cn("h-1.5 w-6 rounded-full", line)} />
      <span className={cn("h-1.5 w-6 rounded-full", line)} />
      {variant !== "minimal" && <span className={cn("h-1.5 w-6 rounded-full", line)} />}
      <span className="flex-1" />
      <span className={cn("size-2.5 rounded-full", line)} />
    </div>
  )
}

function FooterWireframe({ variant }: { variant: string }) {
  if (variant === "dark") {
    return (
      <div className="flex h-11 flex-col items-center justify-center gap-2 rounded-lg bg-slate-800 p-2">
        <div className="flex gap-1.5">
          <span className="h-1.5 w-5 rounded-full bg-white/30" />
          <span className="h-1.5 w-5 rounded-full bg-white/30" />
          <span className="h-1.5 w-5 rounded-full bg-white/30" />
        </div>
        <span className="h-1.5 w-16 rounded-full bg-white/20" />
      </div>
    )
  }

  const columns = variant === "two-col" ? 2 : 3
  return (
    <div className="flex h-11 flex-col justify-between rounded-lg border bg-background p-2">
      <div
        className="grid flex-1 gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="h-1 w-4 rounded-full bg-foreground/20" />
            <span className="h-1 w-6 rounded-full bg-muted-foreground/20" />
          </div>
        ))}
      </div>
      <span className="mx-auto h-1 w-10 rounded-full bg-muted-foreground/20" />
    </div>
  )
}

// ─── Step 7: Product card ───────────────────────────────────────────────────

function StepProductCard({ data, update }: StepProps) {
  const preset =
    PRODUCT_CARD_PRESETS.find((p) => p.id === data.productCardPresetId) ??
    PRODUCT_CARD_PRESETS[0]!
  const radius = resolveRadiusPreset(data.radiusId)

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex min-w-[280px] flex-1 flex-col gap-2.5">
        <SectionLabel>اختر الشكل</SectionLabel>
        {PRODUCT_CARD_PRESETS.map((option) => {
          const selected = data.productCardPresetId === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => update("productCardPresetId", option.id)}
              className={cn(
                "flex items-center gap-3.5 rounded-2xl bg-muted/30 p-3 text-start transition-colors",
                selected
                  ? "border-2 border-secondary"
                  : "border border-border hover:border-secondary/40"
              )}
            >
              <span className="flex h-14 w-16 shrink-0 flex-col overflow-hidden rounded-lg border bg-background">
                <span className="h-7 bg-muted" />
                <span className="flex flex-1 flex-col justify-center gap-1 p-1.5">
                  <span className="h-1 w-3/4 rounded-full bg-foreground/15" />
                  <span
                    className="h-1 w-2/5 rounded-full"
                    style={{ backgroundColor: data.colors.primary }}
                  />
                </span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm font-bold">{option.name}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {option.description}
                </span>
              </span>
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full",
                  selected
                    ? "bg-secondary text-secondary-foreground"
                    : "border border-border"
                )}
              >
                {selected && <Check className="size-3.5" />}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex w-80 shrink-0 flex-col gap-3 rounded-2xl border bg-muted/30 p-5">
        <div className="flex items-center justify-between gap-2">
          <SectionLabel>معاينة مباشرة</SectionLabel>
          <span className="rounded-md border bg-background px-2 py-1 text-[11px] text-muted-foreground">
            منتج تجريبي
          </span>
        </div>

        <div
          className="overflow-hidden border bg-background shadow-sm"
          style={{ borderRadius: radius.scales.radiusLg }}
        >
          <div className="flex h-40 items-center justify-center bg-muted text-xs text-muted-foreground">
            صورة المنتج
          </div>
          <div className="flex flex-col gap-3 p-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[15px] font-bold">قميص كتان صيفي</span>
              {preset.showDescription && (
                <span className="text-xs leading-relaxed text-muted-foreground">
                  قماش كتان خفيف بقصة مريحة، متوفر بأربعة ألوان.
                </span>
              )}
              <span
                className="text-[17px] font-extrabold"
                style={{ color: data.colors.primary }}
                dir="ltr"
              >
                185 SYP
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span
                className="px-4 py-2.5 text-center text-sm font-bold text-white"
                style={{
                  backgroundColor: resolveButtonColor(data, "primary"),
                  borderRadius: radius.buttonRadius,
                }}
              >
                أضف إلى السلة
              </span>
              {preset.showDetailsButton && (
                <span
                  className="border px-4 py-2.5 text-center text-sm font-bold"
                  style={{
                    color: data.colors.primary,
                    borderColor: data.colors.primary,
                    borderRadius: radius.buttonRadius,
                  }}
                >
                  عرض التفاصيل
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          هذا هو الشكل الذي سيراه عملاؤك في صفحات المنتجات ونتائج البحث.
        </p>
      </div>
    </div>
  )
}

// ─── Step 8: Home sections ──────────────────────────────────────────────────

function toggleGeneralSection(
  data: WizardState,
  update: StepProps["update"],
  presetId: string
) {
  if (data.generalSectionIds.includes(presetId)) {
    update(
      "generalSectionIds",
      data.generalSectionIds.filter((id) => id !== presetId)
    )
    return
  }
  // Keep selection order aligned with the GENERAL_PRESETS catalog order.
  update(
    "generalSectionIds",
    GENERAL_PRESETS.map((preset) => preset.id).filter(
      (id) => id === presetId || data.generalSectionIds.includes(id)
    )
  )
}

function StepHomeSections({
  data,
  update,
  locked,
  onPreview,
}: StepProps & {
  locked: boolean
  onPreview: (preset: SectionPreset) => void
}) {
  if (locked) {
    return (
      <div className="rounded-2xl border bg-muted/20 p-6">
        <p className="text-sm font-bold">أقسام الرئيسية تأتي من القالب الأساسي</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          اخترت البدء من قالب جاهز، لذلك ستُنسخ صفحاته وأقسامه كما هي. ارجع إلى
          خطوة «الهوية والاسم» واختر «من الصفر» إذا أردت تركيب الصفحة الرئيسية
          بنفسك.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionLabel>قسم الهيرو</SectionLabel>
          <span className="text-xs text-muted-foreground">قسم واحد فقط</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3.5">
          {HERO_PRESETS.map((preset) => (
            <SectionCard
              key={preset.id}
              preset={preset}
              selected={data.heroPresetId === preset.id}
              multi={false}
              onToggle={() => update("heroPresetId", preset.id)}
              onPreview={() => onPreview(preset)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionLabel>
            الأقسام العامة — تم اختيار {data.generalSectionIds.length}
          </SectionLabel>
          <span className="text-xs text-muted-foreground">
            يمكنك إعادة الترتيب لاحقاً من المحرر.
          </span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3.5">
          {GENERAL_PRESETS.map((preset) => (
            <SectionCard
              key={preset.id}
              preset={preset}
              selected={data.generalSectionIds.includes(preset.id)}
              multi
              onToggle={() => toggleGeneralSection(data, update, preset.id)}
              onPreview={() => onPreview(preset)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-muted/20 p-4">
        <p className="text-sm font-bold">صفحات القالب الافتراضية</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>/ — الرئيسية (هيرو + الأقسام المختارة + شبكة المنتجات)</li>
          <li>/products — قائمة المنتجات</li>
          <li>/products/:product-slug — تفاصيل المنتج (ديناميكية)</li>
          <li>/cart — السلة</li>
          <li>/login — تسجيل الدخول</li>
          <li>/verify-otp — التحقق من الرمز</li>
          <li>/checkout — إتمام الطلب</li>
          <li>/orders — طلباتي</li>
          <li>/orders/:order-id — تفاصيل الطلب (ديناميكية)</li>
          <li>/settings — إعدادات الحساب</li>
        </ul>
      </div>
    </div>
  )
}

function SectionCard({
  preset,
  selected,
  multi,
  onToggle,
  onPreview,
}: {
  preset: SectionPreset
  selected: boolean
  multi: boolean
  onToggle: () => void
  onPreview: () => void
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 overflow-hidden rounded-2xl bg-muted/30 p-2.5 transition-colors",
        selected ? "border-2 border-secondary" : "border border-border"
      )}
    >
      <button type="button" onClick={onToggle} className="overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            preset.previewImage ??
            "https://placehold.co/480x270/e2e8f0/64748b?text=Section"
          }
          alt=""
          className="aspect-video w-full object-cover"
        />
      </button>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center",
            multi ? "rounded-md" : "rounded-full",
            selected ? "bg-secondary text-secondary-foreground" : "border border-border"
          )}
          aria-label={selected ? "إزالة القسم" : "إضافة القسم"}
        >
          {selected && <Check className="size-3" />}
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 truncate text-start text-[13px] font-bold"
        >
          {preset.title}
        </button>
        <Button
          variant="outline"
          size="icon"
          className="size-7 shrink-0"
          onClick={onPreview}
          title="معاينة القسم"
          aria-label="معاينة القسم"
        >
          <Eye className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Section preview dialog ─────────────────────────────────────────────────

function SectionPreviewDialog({
  preset,
  selected,
  onToggle,
  onClose,
}: {
  preset: SectionPreset | null
  selected: boolean
  onToggle: (preset: SectionPreset) => void
  onClose: () => void
}) {
  return (
    <Dialog open={Boolean(preset)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="md" className="gap-0 p-0" showCloseButton={false}>
        {preset && (
          <>
            <header className="flex items-start justify-between gap-4 border-b p-6">
              <div className="min-w-0">
                <DialogTitle className="text-lg font-extrabold">
                  {preset.title}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  معاينة بمحتوى تجريبي — ستظهر بمنتجاتك الحقيقية بعد التطبيق.
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="size-9 shrink-0"
                onClick={onClose}
                aria-label="إغلاق"
              >
                <X className="size-4" />
              </Button>
            </header>

            <div className="max-h-[60vh] overflow-y-auto bg-muted/30 p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  preset.previewImage ??
                  "https://placehold.co/960x540/e2e8f0/64748b?text=Section"
                }
                alt=""
                className="w-full rounded-xl border bg-background object-cover"
              />
            </div>

            <footer className="flex items-center justify-end gap-2 border-t p-4">
              {preset.category === "hero" ? (
                <Button
                  variant={selected ? "outline" : "secondary"}
                  onClick={() => {
                    onToggle(preset)
                    onClose()
                  }}
                  disabled={selected}
                >
                  {selected ? "الهيرو المختار" : "استخدام هذا الهيرو"}
                </Button>
              ) : (
                <Button
                  variant={selected ? "outline" : "secondary"}
                  onClick={() => onToggle(preset)}
                >
                  {selected ? "إزالة من الرئيسية" : "إضافة إلى الرئيسية"}
                </Button>
              )}
            </footer>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── State → theme resolution ───────────────────────────────────────────────

function resolveRadiusPreset(radiusId: string): RadiusPreset {
  return RADIUS_PRESETS.find((p) => p.id === radiusId) ?? RADIUS_PRESETS[1]!
}

function resolveTextScalePreset(textScaleId: string): TextScalePreset {
  return TEXT_SCALE_PRESETS.find((p) => p.id === textScaleId) ?? TEXT_SCALE_PRESETS[1]!
}

/** Merged scale values (defaults + text scale + radius preset). */
function resolveScales(state: WizardState): ScaleThemeProps {
  return {
    ...DEFAULT_SCALES,
    ...resolveTextScalePreset(state.textScaleId).scales,
    ...resolveRadiusPreset(state.radiusId).scales,
  }
}

function resolveButtonColor(state: WizardState, key: ButtonVariantKey): string {
  const source = state.buttonSources[key]
  if (source === "manual") return state.buttonManualColors[key]
  return state.colors[source]
}

function buildThemeProps(state: WizardState): FullThemeProps {
  const radius = resolveRadiusPreset(state.radiusId)

  return {
    bodyFont: state.fonts.bodyFont,
    fontOption1: state.fonts.fontOption1,
    fontOption2: state.fonts.fontOption2,
    ...state.colors,
    badgeShape: state.badgeShape,
    badgeStyle: state.badgeStyle,
    ...DEFAULT_SHELL,
    ...resolveScales(state),
    buttonVariantPrimaryBg: resolveButtonColor(state, "primary"),
    buttonVariantPrimaryFg: "#ffffff",
    buttonVariantPrimaryRadius: radius.buttonRadius,
    buttonVariantSecondaryBg: resolveButtonColor(state, "secondary"),
    buttonVariantSecondaryFg: "#ffffff",
    buttonVariantSecondaryRadius: radius.buttonRadius,
    buttonVariantErrorBg: resolveButtonColor(state, "error"),
    buttonVariantErrorFg: "#ffffff",
    buttonVariantErrorRadius: radius.buttonRadius,
  }
}

// ─── State → SiteData ───────────────────────────────────────────────────────

function clonePresetSection(preset: SectionPreset): SitePage["content"][number] {
  return structuredClone(preset.componentData) as SitePage["content"][number]
}

function findFormPreset(id: string): SectionPreset | undefined {
  return FORMS_PRESETS.find((preset) => preset.id === id)
}

async function buildSiteDataFromState(
  state: WizardState
): Promise<Partial<SiteData>> {
  const headerPreset =
    HEADER_PRESETS.find((h) => h.id === state.headerPresetId) ?? HEADER_PRESETS[0]!
  const footerPreset =
    FOOTER_PRESETS.find((f) => f.id === state.footerPresetId) ?? FOOTER_PRESETS[0]!

  const rootProps: Record<string, unknown> = {
    title: state.themeName || "متجر SOOQ",
    direction: "rtl",
    language: "ar",
    currency: "SYP",
    ...buildThemeProps(state),
    headerVisible: true,
    headerBrandHref: "/",
    headerBrandTitle: state.themeName || "",
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

  // "ابدأ من قالب": reuse the built-in theme's pages/zones, restyled with the
  // tokens picked in the wizard.
  if (state.baseKey !== BLANK_BASE_KEY) {
    const base = await loadBuiltinThemeSiteData(state.baseKey)
    if (base) {
      return {
        ...base,
        root: {
          ...base.root,
          props: { ...(base.root?.props ?? {}), ...rootProps },
        },
      }
    }
  }

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

  const loginPreset = findFormPreset("form-login")
  const verifyOtpPreset = findFormPreset("form-verify-otp")

  const homePage: SitePage = {
    path: "/",
    slug: "/",
    name: "الرئيسية",
    link: "/",
    title: state.themeName || "الرئيسية",
    description: state.themeDescription || "",
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

  const productsPage: SitePage = {
    path: "/products",
    slug: "/products",
    name: "المنتجات",
    link: "/products",
    title: "المنتجات",
    description: "قائمة المنتجات مع الفلاتر",
    iconName: "Package",
    content: createProductsPagePresetContent() as SitePage["content"],
  }

  const productDetailsPage: SitePage = {
    path: "/products/:product-slug",
    slug: "/products/example-product",
    name: "تفاصيل المنتج",
    link: "/products/example-product",
    title: "تفاصيل المنتج",
    description: "صفحة تفاصيل المنتج (ديناميكية)",
    iconName: "Package",
    dynamic: true,
    examplePath: "/products/example-product",
    content: [createProductDetailSection() as SitePage["content"][number]],
  }

  const checkoutPage: SitePage = {
    path: "/checkout",
    slug: "/checkout",
    name: "إتمام الطلب",
    link: "/checkout",
    title: "إتمام الطلب",
    description: "عنوان التوصيل وطريقة الدفع وتأكيد الطلب",
    iconName: "ShoppingCart",
    content: createCheckoutPageContent() as SitePage["content"],
  }

  const ordersPage: SitePage = {
    path: "/orders",
    slug: "/orders",
    name: "طلباتي",
    link: "/orders",
    title: "طلباتي",
    description: "قائمة طلبات العميل",
    iconName: "Package",
    content: createOrdersPageContent() as SitePage["content"],
  }

  const orderDetailPage: SitePage = {
    path: "/orders/:order-id",
    slug: "/orders/example-order",
    name: "تفاصيل الطلب",
    link: "/orders/example-order",
    title: "تفاصيل الطلب",
    description: "صفحة تفاصيل الطلب (ديناميكية)",
    iconName: "Package",
    dynamic: true,
    examplePath: "/orders/example-order",
    content: createOrderDetailPageContent() as SitePage["content"],
  }

  const settingsPage: SitePage = {
    path: "/settings",
    slug: "/settings",
    name: "إعدادات الحساب",
    link: "/settings",
    title: "إعدادات الحساب",
    description: "الملف الشخصي وتفضيلات التسويق والعناوين المحفوظة",
    iconName: "FileText",
    content: createSettingsPageContent() as SitePage["content"],
  }

  const cancelOrderPopup = createCancelOrderZonePopup()
  cancelOrderPopup.props.is_active = false

  return {
    root: { props: rootProps },
    zones: {
      [ROOT_ZONE_POPUP]: [cancelOrderPopup],
    } as SiteData["zones"],
    pages: [
      homePage,
      productsPage,
      productDetailsPage,
      cartPage,
      loginPage,
      verifyOtpPage,
      checkoutPage,
      ordersPage,
      orderDetailPage,
      settingsPage,
    ],
  }
}
