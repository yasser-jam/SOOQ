"use client"

import React from "react"
import { getClassNameFactory } from "@/core/lib"
import styles from "./styles.module.css"
import { COLOR_KEYS, ColorKey, ColorTheme, DEFAULT_COLORS } from "../../../theme"
import type { SettingsRootProps } from "./index"

const getClassName = getClassNameFactory("SettingsPanel", styles)

function ColorBadge({ colorKey, label, value, defaultValue, onChange }: { colorKey: ColorKey; label: string; value: string; defaultValue: string; onChange: (k: ColorKey, v: string) => void }) {
  const isDefault = value === defaultValue

  return (
    <div className={getClassName("colorBadge")}>
      <div className={getClassName("colorBadgeSwatch")} style={{ background: value }}>
        <input type="color" value={value} onChange={(e) => onChange(colorKey, e.target.value.toUpperCase())} />
      </div>
      <span className={getClassName("colorBadgeLabel")}>{label}</span>
      {!isDefault && (
        <button type="button" className={getClassName("resetColor")} title={`إعادة إلى الافتراضي (${defaultValue})`} onClick={() => onChange(colorKey, defaultValue)}>
          ↺
        </button>
      )}
    </div>
  )
}

export default function ColorsBlock({ rootProps, updateProps }: { rootProps?: SettingsRootProps; updateProps: (p: Partial<SettingsRootProps>) => void }) {
  const colors: ColorTheme = {
    primary: rootProps?.primary ?? DEFAULT_COLORS.primary,
    surface: rootProps?.surface ?? DEFAULT_COLORS.surface,
    success: rootProps?.success ?? DEFAULT_COLORS.success,
    warning: rootProps?.warning ?? DEFAULT_COLORS.warning,
    error: rootProps?.error ?? DEFAULT_COLORS.error,
    dark: rootProps?.dark ?? DEFAULT_COLORS.dark,
    text: rootProps?.text ?? DEFAULT_COLORS.text,
    neutral: rootProps?.neutral ?? DEFAULT_COLORS.neutral,
  }

  const updateColor = (key: ColorKey, value: string) => updateProps({ [key]: value } as any)

  return (
    <div className={getClassName("section")}>
      <div className={getClassName("sectionTitle")}>لوحة الألوان</div>
      <div className="grid grid-cols-3 gap-2">
        {COLOR_KEYS.map(({ key, label }) => (
          <ColorBadge key={key} colorKey={key} label={label} value={colors[key]} defaultValue={DEFAULT_COLORS[key]} onChange={updateColor} />
        ))}
      </div>
    </div>
  )
}
