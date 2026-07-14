"use client"

import { getClassNameFactory } from "@/core/lib"
import styles from "./styles.module.css"
import {
  DEFAULT_BADGE,
  DEFAULT_SHELL,
  DEFAULT_BREAKPOINTS,
  DEFAULT_SPACING_SCALE,
  FullThemeProps,
  SpacingScaleProps,
} from "../../../theme"
import type { SettingsRootProps } from "./index"
import OptionTabs from "./OptionTabs"

const getClassName = getClassNameFactory("SettingsPanel", styles)

const BADGE_SHAPE_OPTIONS = [
  { label: "مستدير", value: "rounded" },
  { label: "حبة دواء (Pill)", value: "pill" },
  { label: "مربع", value: "square" },
]

const BADGE_STYLE_OPTIONS = [
  { label: "صلب", value: "solid" },
  { label: "حدود", value: "outline" },
  { label: "ناعم", value: "soft" },
]

const SHELL_VARIANT_OPTIONS = [
  { label: "تجاري", value: "commerce" },
  { label: "افتراضي (قديم)", value: "default" },
]

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="space-y-2 block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const nextValue = Number(event.target.value)
          if (Number.isNaN(nextValue)) return
          onChange(nextValue)
        }}
        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  )
}

export default function LookBlock({ rootProps, updateProps }: { rootProps?: SettingsRootProps; updateProps: (p: Partial<SettingsRootProps>) => void }) {
  const badgeShape = rootProps?.badgeShape ?? DEFAULT_BADGE.badgeShape
  const badgeStyle = rootProps?.badgeStyle ?? DEFAULT_BADGE.badgeStyle
  const headerVariant = rootProps?.headerVariant ?? DEFAULT_SHELL.headerVariant
  const footerVariant = rootProps?.footerVariant ?? DEFAULT_SHELL.footerVariant
  const bpMobile = rootProps?.breakpointMobileMax ?? DEFAULT_BREAKPOINTS.breakpointMobileMax
  const bpTablet = rootProps?.breakpointTabletMax ?? DEFAULT_BREAKPOINTS.breakpointTabletMax

  return (
    <div className={getClassName("section")}>
      <div className={getClassName("sectionTitle")}>المظهر</div>
      <p className={getClassName("sectionHint")}>
        تحكم في شكل الشارات، وتخطيطات الرأس والتذييل، وحدود نقاط التوقف.
      </p>

      <div className={getClassName("field")}>
        <OptionTabs label="شكل الشارة" value={badgeShape} options={BADGE_SHAPE_OPTIONS} onValueChange={(v) => updateProps({ badgeShape: v as any })} />
      </div>

      <div className={getClassName("field")}>
        <OptionTabs label="نمط الشارة" value={badgeStyle} options={BADGE_STYLE_OPTIONS} onValueChange={(v) => updateProps({ badgeStyle: v as any })} />
      </div>

      <div className={getClassName("sectionTitle")}>الرأس والتذييل</div>
      <div className={getClassName("field")}>
        <OptionTabs label="تخطيط الرأس" value={headerVariant} options={SHELL_VARIANT_OPTIONS} onValueChange={(v) => updateProps({ headerVariant: v as any })} />
      </div>
      <div className={getClassName("field")}>
        <OptionTabs label="تخطيط التذييل" value={footerVariant} options={SHELL_VARIANT_OPTIONS} onValueChange={(v) => updateProps({ footerVariant: v as any })} />
      </div>

      <div className={getClassName("sectionTitle")}>سلّم المسافات</div>
      <p className={getClassName("sectionHint")}>
        قيم الدرجات (ضيقة/متوسطة/واسعة) التي تظهر في حقول المسافات لكل الأقسام —
        غيّرها هنا مرة واحدة لينعكس الإيقاع على المتجر كله.
      </p>
      {(
        [
          { key: "spacingVerticalNarrow", label: "عمودية — ضيقة (px)" },
          { key: "spacingVerticalMedium", label: "عمودية — متوسطة (px)" },
          { key: "spacingVerticalWide", label: "عمودية — واسعة (px)" },
          { key: "spacingSideNarrow", label: "جانبية — ضيقة (px)" },
          { key: "spacingSideMedium", label: "جانبية — متوسطة (px)" },
          { key: "spacingSideWide", label: "جانبية — واسعة (px)" },
        ] as { key: keyof SpacingScaleProps; label: string }[]
      ).map(({ key, label }) => {
        const raw = rootProps?.[key] ?? DEFAULT_SPACING_SCALE[key]
        const current = parseInt(String(raw), 10) || 0
        return (
          <div key={key} className={getClassName("field")}>
            <NumberField
              label={label}
              value={current}
              min={0}
              max={200}
              onChange={(nextValue) =>
                updateProps({ [key]: `${nextValue}px` } as Partial<SettingsRootProps>)
              }
            />
          </div>
        )
      })}

      <div className={getClassName("sectionTitle")}>نقاط التوقف</div>
      <p className={getClassName("sectionHint")}>
        أقصى عرض (px) للهاتف والجهاز اللوحي. يستخدم مع خيار إخفاء العرض لكل كتلة.
      </p>
      <div className={getClassName("field")}>
        <NumberField label="الهاتف — أقصى عرض (px)" value={bpMobile} min={320} max={2000} onChange={(nextValue) => updateProps({ breakpointMobileMax: nextValue, breakpointTabletMax: bpTablet } as any)} />
      </div>
      <div className={getClassName("field")}>
        <NumberField label="الجهاز اللوحي — أقصى عرض (px)" value={bpTablet} min={321} max={2400} onChange={(nextValue) => updateProps({ breakpointMobileMax: bpMobile, breakpointTabletMax: nextValue } as any)} />
      </div>
    </div>
  )
}
