"use client"

import { getClassNameFactory } from "@/core/lib"
import styles from "./styles.module.css"
import {
  ARABIC_FONT_OPTIONS,
  FONT_OPTIONS,
  DEFAULT_SCALES,
  ensureGoogleFontsLoaded,
  ScaleThemeProps,
} from "../../../theme"
import type { SettingsRootProps } from "./index"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/ui/components/select"
import { Input } from "@workspace/ui/components/input"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { useEffect, useMemo, useState } from "react"

const getClassName = getClassNameFactory("SettingsPanel", styles)

function stripUnit(value: string): string {
  return value.replace(/(px|rem)$/g, "").trim()
}

function addUnit(value: string, unit: "rem" | "px"): string {
  const n = parseFloat(value)
  return isNaN(n) ? value : `${n}${unit}`
}

function FontSelectItem({ font }: { font: (typeof FONT_OPTIONS)[number] }) {
  return (
    <span
      className="flex w-full items-center justify-between gap-2"
      style={{ fontFamily: font.cssValue }}
      dir="rtl"
      lang="ar"
    >
      <span>{font.label}</span>
      {font.supportedLocales.includes("ar") && font.value !== "system" && (
        <span className="text-[10px] text-muted-foreground" style={{ fontFamily: font.cssValue }}>
          أبجد
        </span>
      )}
    </span>
  )
}

function buildFontSelectOptions(selected: string[]) {
  const seen = new Set<string>()
  const out: (typeof FONT_OPTIONS)[number][] = []
  for (const font of ARABIC_FONT_OPTIONS) {
    seen.add(font.value)
    out.push(font)
  }
  for (const key of selected) {
    if (!key || seen.has(key)) continue
    const entry = FONT_OPTIONS.find((f) => f.value === key)
    if (entry) {
      seen.add(entry.value)
      out.push(entry)
    }
  }
  return out
}

const BUTTON_SIZE_GROUPS = [
  { label: "صغير", heightKey: "buttonSmHeight" as const, paddingXKey: "buttonSmPaddingX" as const, paddingYKey: "buttonSmPaddingY" as const },
  { label: "متوسط", heightKey: "buttonMdHeight" as const, paddingXKey: "buttonMdPaddingX" as const, paddingYKey: "buttonMdPaddingY" as const },
  { label: "كبير", heightKey: "buttonLgHeight" as const, paddingXKey: "buttonLgPaddingX" as const, paddingYKey: "buttonLgPaddingY" as const },
] as const;

export default function FontsBlock({ rootProps, updateProps }: { rootProps?: SettingsRootProps; updateProps: (p: Partial<SettingsRootProps>) => void }) {
  const bodyFont = (rootProps?.bodyFont ?? "") as string
  const fontOption1 = (rootProps?.fontOption1 ?? "") as string
  const fontOption2 = (rootProps?.fontOption2 ?? "") as string

  const [activeRadiusKey, setActiveRadiusKey] = useState("radiusMd")

  const fontSelectOptions = useMemo(
    () => buildFontSelectOptions([bodyFont, fontOption1, fontOption2]),
    [bodyFont, fontOption1, fontOption2]
  )

  // Prefetch Arabic fonts so select items render with real faces.
  useEffect(() => {
    ensureGoogleFontsLoaded(
      document,
      fontSelectOptions.map((f) => f.value)
    )
  }, [fontSelectOptions])

  const radiusKeys = [
    "radiusNone",
    "radiusSm",
    "radiusMd",
    "radiusLg",
    "radiusXl",
    "radiusFull",
  ] as const

  const currentRadiusValue = (rootProps?.[activeRadiusKey] ?? DEFAULT_SCALES[activeRadiusKey]) as string

  return (
    <div className={getClassName("section")}>
      <div className={getClassName("sectionTitle")}>الخطوط</div>

      <div className={getClassName("field")}>
        <div className="text-xs font-medium text-foreground mb-1">خط النص الرئيسي</div>
        <Select value={bodyFont} onValueChange={(v) => updateProps({ bodyFont: v })}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="اختر خط" />
          </SelectTrigger>
          <SelectContent>
            {fontSelectOptions.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                <FontSelectItem font={f} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={getClassName("field")}>
        <div className="text-xs font-medium text-foreground mb-1">الخط الرئيسي (الخيار 1)</div>
        <Select value={fontOption1} onValueChange={(v) => updateProps({ fontOption1: v })}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="اختر خط" />
          </SelectTrigger>
          <SelectContent>
            {fontSelectOptions.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                <FontSelectItem font={f} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={getClassName("field")}>
        <div className="text-xs font-medium text-foreground mb-1">الخط الثانوي (الخيار 2)</div>
        <Select value={fontOption2} onValueChange={(v) => updateProps({ fontOption2: v })}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="اختر خط" />
          </SelectTrigger>
          <SelectContent>
            {fontSelectOptions.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                <FontSelectItem font={f} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={getClassName("sectionTitle")}>أوزان الخط</div>

      {([
        ["fontWeightLight", "خفيف (400)"],
        ["fontWeightNormal", "عادي (500)"],
        ["fontWeightMedium", "متوسط (600)"],
        ["fontWeightSemibold", "شبه غامق (700)"],
        ["fontWeightBold", "غامق (900)"],
      ] as const).map(([key, label]) => (
        <div key={key} className={getClassName("field")}>
          <label className="space-y-2 block">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <Input
              size="sm"
              type="number"
              value={stripUnit((rootProps?.[key] ?? DEFAULT_SCALES[key]) as string)}
              onChange={(e) => updateProps({ [key]: e.target.value } as Partial<ScaleThemeProps>)}
            />
          </label>
        </div>
      ))}

      <div className={getClassName("sectionTitle")}>أحجام النص</div>

      {([
        ["textSizeXs", "XS"],
        ["textSizeSm", "SM"],
        ["textSizeMd", "MD"],
        ["textSizeLg", "LG"],
        ["textSizeXl", "XL"],
        ["textSize2xl", "2XL"],
      ] as const).map(([key, label]) => (
        <div key={key} className={getClassName("field")}>
          <label className="space-y-2 block">
            <span className="text-sm font-medium text-foreground">حجم النص {label} (rem)</span>
            <Input
              size="sm"
              type="number"
              value={stripUnit((rootProps?.[key] ?? DEFAULT_SCALES[key]) as string)}
              onChange={(e) => updateProps({ [key]: addUnit(e.target.value, "rem") } as Partial<ScaleThemeProps>)}
            />
          </label>
        </div>
      ))}

      <div className={getClassName("sectionTitle")}>قياسات الحدود</div>

      {([
        ["radiusNone", "None"],
        ["radiusSm", "Sm"],
        ["radiusMd", "Md"],
        ["radiusLg", "Lg"],
        ["radiusXl", "Xl"],
        ["radiusFull", "Full"],
      ] as const).map(([key, label]) => (
        <div key={key} className={getClassName("field")}>
          <label className="space-y-2 block">
            <span className="text-sm font-medium text-foreground">الميلان {label} (px)</span>
            <Input
              size="sm"
              type="number"
              value={stripUnit((rootProps?.[key] ?? DEFAULT_SCALES[key]) as string)}
              onChange={(e) => updateProps({ [key]: addUnit(e.target.value, "px") } as Partial<ScaleThemeProps>)}
            />
          </label>
        </div>
      ))}

      <div className={getClassName("sectionTitle")}>أحجام الأزرار</div>

      {BUTTON_SIZE_GROUPS.map((g) => (
        <div key={g.heightKey} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{g.label}</div>
          <div className={getClassName("field")}>
            <label className="space-y-2 block">
              <span className="text-sm font-medium text-foreground">الحشوة الأفقية (px)</span>
              <Input
                size="sm"
                type="number"
                value={stripUnit((rootProps?.[g.paddingXKey] ?? DEFAULT_SCALES[g.paddingXKey]) as string)}
                onChange={(e) => updateProps({ [g.paddingXKey]: addUnit(e.target.value, "px") } as Partial<ScaleThemeProps>)}
              />
            </label>
          </div>
          <div className={getClassName("field")}>
            <label className="space-y-2 block">
              <span className="text-sm font-medium text-foreground">الحشوة العمودية (px)</span>
              <Input
                size="sm"
                type="number"
                value={stripUnit((rootProps?.[g.paddingYKey] ?? DEFAULT_SCALES[g.paddingYKey]) as string)}
                onChange={(e) => updateProps({ [g.paddingYKey]: addUnit(e.target.value, "px") } as Partial<ScaleThemeProps>)}
              />
            </label>
          </div>
        </div>
      ))}

      <div className={getClassName("radiusPreviewSection")}>
        <div className="text-xs font-medium text-foreground mb-2">معاينة الميلان</div>
        <Tabs value={activeRadiusKey} onValueChange={setActiveRadiusKey} className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-transparent p-0">
            {radiusKeys.map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex-1 rounded-md border border-border bg-white px-2 py-1 text-xs text-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {key === "radiusNone" ? "None" :
                 key === "radiusSm" ? "Sm" :
                 key === "radiusMd" ? "Md" :
                 key === "radiusLg" ? "Lg" :
                 key === "radiusXl" ? "Xl" :
                 "Full"}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div
          className={getClassName("radiusPreview")}
          style={{ borderRadius: currentRadiusValue }}
        />
      </div>
    </div>
  )
}
