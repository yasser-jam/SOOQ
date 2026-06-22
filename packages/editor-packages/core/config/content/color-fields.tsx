"use client";
import React from "react";
import type { CustomField } from "@/core/types";
import { colorVar, ColorKey } from "../theme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
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

const FIXED_VALUE = "__fixed__";

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

function ThemeColorSelectRender({
  value,
  onChange,
  readOnly,
  Label,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  Label: React.FC<{ label?: string; readOnly?: boolean; children?: React.ReactNode }>;
  label?: string;
}) {
  const currentValue = value ?? "";
  const isThemeValue = THEME_COLOR_OPTIONS.some((o) => `theme-${o.value}` === currentValue);
  const isFixed = !isThemeValue;
  const selectValue = isFixed ? FIXED_VALUE : currentValue;

  return (
    <Label label={label} readOnly={readOnly}>
      <div className="flex flex-col gap-1.5">
        <Select
          value={selectValue}
          onValueChange={(v) => {
            if (v === FIXED_VALUE) {
              onChange("");
            } else {
              onChange(v);
            }
          }}
          disabled={readOnly}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="اختر" />
          </SelectTrigger>
          <SelectContent>
            {THEME_COLOR_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={`theme-${opt.value}`}>
                {opt.label}
              </SelectItem>
            ))}
            <SelectItem value={FIXED_VALUE}>ثابت (مخصص)</SelectItem>
          </SelectContent>
        </Select>
        {isFixed && (
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              aria-label="اختيار لون مخصص"
              value={/^#[0-9A-Fa-f]{6}$/.test(currentValue) ? currentValue : "#000000"}
              onChange={(e) => onChange(e.target.value)}
              disabled={readOnly}
              className="size-7 shrink-0 cursor-pointer border-none bg-transparent p-0"
            />
            <Input
              value={currentValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              disabled={readOnly}
              spellCheck={false}
              maxLength={7}
            />
          </div>
        )}
      </div>
    </Label>
  );
}

export const colorField: CustomField<string> = {
  type: "custom",
  label: "اللون",
  render: ({ value, onChange, readOnly, Label, label }: any) => (
    <ThemeColorSelectRender
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      Label={Label}
      label={label}
    />
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
