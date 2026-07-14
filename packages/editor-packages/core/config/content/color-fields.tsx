"use client";
import React from "react";
import type { CustomField } from "@/core/types";
import { colorVar, ColorKey } from "../theme";
import { PlainColorInput } from "../fields/ThemeColorField";
import { Input } from "@workspace/ui/components/input";

export const THEME_COLOR_OPTIONS: { label: string; value: ColorKey }[] = [
  { label: "أساسي", value: "primary" },
  { label: "سطح", value: "surface" },
  { label: "نجاح", value: "success" },
  { label: "تحذير", value: "warning" },
  { label: "خطأ", value: "error" },
  { label: "داكن", value: "dark" },
  { label: "نص", value: "text" },
  { label: "محايد", value: "neutral" },
];

export const COLOR_SELECT_OPTIONS = THEME_COLOR_OPTIONS.map(({ value, label }) => ({
  label,
  value,
}));

export function resolveColor(value: string): string {
  if (!value) return "inherit";
  if (value.startsWith("theme-")) {
    const key = value.slice(6) as ColorKey;
    return `var(${colorVar(key)})`;
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value;
  if (/^#[0-9A-Fa-f]{3}$/.test(value)) return value;
  if (/^rgb/.test(value)) return value;
  return value;
}

export function resolveContentColor(
  mode: "theme" | "fixed" | undefined,
  theme: ColorKey | undefined,
  fixed: string | undefined
): string {
  const m = mode ?? "theme";
  if (m === "theme") {
    return `var(${colorVar((theme ?? "text") as ColorKey)})`;
  }
  return fixed ?? "#0f172a";
}

/**
 * Shared text-color field (15 blocks). A normal color picker (native input +
 * hex) per merchant feedback. Old "theme-<key>" values display as their
 * current theme hex; the first edit persists a plain hex string, which
 * `resolveColor` accepts as it always has.
 */
export const colorField: CustomField<string> = {
  type: "custom",
  label: "اللون",
  metadata: { group: "typography" },
  render: ({ value, onChange, readOnly, Label, label }: any) => (
    <Label label={label ?? "اللون"} readOnly={readOnly}>
      <PlainColorInput value={value} onChange={onChange} readOnly={readOnly} />
    </Label>
  ),
};

const colorFixedCustom: CustomField<string> = {
  type: "custom",
  label: "اللون (مخصص)",
  render: ({ value, onChange }: { value: any; onChange: any }) => {
    const v = typeof value === "string" ? value : "";
    const validHex = /^#[0-9A-Fa-f]{6}$/.test(v);
    return (
      <div className="flex w-full items-center gap-2">
        <input
          type="color"
          aria-label="اختيار لون"
          value={validHex ? v : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="size-7 shrink-0 cursor-pointer border-none bg-transparent p-0"
        />
        <Input
          value={v}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          spellCheck={false}
          maxLength={7}
          className="flex-1 min-w-0"
        />
      </div>
    );
  },
};

const colorThemeField = {
  type: "select" as const,
  label: "لون النسق",
  options: COLOR_SELECT_OPTIONS,
};

const colorModeField = {
  type: "radio" as const,
  label: "اللون",
  options: [
    { label: "النسق", value: "theme" },
    { label: "مخصص", value: "fixed" },
  ],
};

export const contentColorFields = {
  colorMode: colorModeField,
  colorTheme: colorThemeField,
  colorFixed: colorFixedCustom,
};
