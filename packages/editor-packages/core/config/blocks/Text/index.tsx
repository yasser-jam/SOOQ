import React from "react";
import { ComponentConfig, Fields, DefaultComponentProps } from "@/core/types";
import { WithLayout, withLayout, hideLayoutPosition } from "../../components/Layout";
import { COMPONENT_FONT_OPTIONS, COMPONENT_FONT_CSS } from "../../theme";
import {
  TEXT_SIZE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  resolveFontSize,
  resolveFontWeight,
  resolveLineHeight,
} from "../../content/typography-fields";
import { resolveColor, colorField } from "../../content/color-fields";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export type TextProps = WithLayout<{
  align: "left" | "center" | "right";
  text?: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  fontFamily?: "body" | "option1" | "option2";
  color: string;
}>;

const alignField = {
  type: "custom" as const,
  label: "المحاذاة",
  render: ({
    value,
    onChange,
    Label,
    label,
    readOnly,
  }: {
    value: string;
    onChange: (v: string) => void;
    Label: React.FC<{ label?: string; readOnly?: boolean; children?: React.ReactNode }>;
    label?: string;
    readOnly?: boolean;
  }) => {
    const current = value ?? "right";
    const options = [
      { value: "right", icon: <AlignRight size={18} />, label: "يمين" },
      { value: "center", icon: <AlignCenter size={18} />, label: "وسط" },
      { value: "left", icon: <AlignLeft size={18} />, label: "يسار" },
    ];
    return (
      <Label label={label} readOnly={readOnly}>
        <div style={{ display: "flex", gap: 6 }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              title={opt.label}
              disabled={readOnly}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 32,
                border: current === opt.value ? "2px solid #3b82f6" : "1px solid #d1d5db",
                borderRadius: 6,
                background: current === opt.value ? "#eff6ff" : "#fff",
                cursor: readOnly ? "not-allowed" : "pointer",
                opacity: readOnly ? 0.5 : 1,
                color: current === opt.value ? "#3b82f6" : "#6b7280",
              }}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </Label>
    );
  },
};

const TextInner: ComponentConfig<TextProps> = {
  label: "نص",
  fields: {
    text: {
      type: "textarea",
      contentEditable: true,
      label: "النص",
    },
    align: alignField,
    fontFamily: {
      type: "select",
      label: "نوع الخط",
      options: COMPONENT_FONT_OPTIONS,
    },
    fontSize: themeFixedSelectField({
      label: "حجم الخط",
      themeOptions: TEXT_SIZE_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
    fontWeight: themeFixedSelectField({
      label: "وزن الخط",
      themeOptions: FONT_WEIGHT_OPTIONS,
      type: "number",
      placeholder: "القيمة الرقمية (مثال: 400)",
    }),
    lineHeight: themeFixedSelectField({
      label: "ارتفاع السطر",
      themeOptions: LINE_HEIGHT_OPTIONS,
      type: "number",
      placeholder: "القيمة (مثال: 1.5)",
    }),
    color: colorField,
  },
  defaultProps: {
    align: "right",
    text: "نص",
    fontSize: "theme-md",
    fontWeight: "theme-light",
    lineHeight: "theme-normal",
    fontFamily: "body",
    color: "theme-text",
  },
  render: ({ align, color, text, fontSize, fontWeight, lineHeight, fontFamily }) => {
    const fontCss = COMPONENT_FONT_CSS[fontFamily ?? "body"] ?? COMPONENT_FONT_CSS.body;
    const fs = resolveFontSize(fontSize);
    const fw = resolveFontWeight(fontWeight);
    const lh = resolveLineHeight(lineHeight);
    const c = resolveColor(color);
    return (
      <span
        style={{
          color: c,
          display: "block",
          textAlign: align,
          width: "100%",
          fontSize: fs,
          fontWeight: fw as React.CSSProperties["fontWeight"],
          lineHeight: lh,
          fontFamily: fontCss,
        }}
      >
        {text}
      </span>
    );
  },
};

const WithLayoutText = withLayout(TextInner);

export const Text: typeof WithLayoutText = {
  ...WithLayoutText,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutText as { resolveFields?: (typeof WithLayoutText)["resolveFields"] }
    ).resolveFields;
    const base = resolver?.(data, params);
    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Fields<TextProps>>).then((f) =>
        hideLayoutPosition(f)
      );
    }
    if (base == null) {
      return hideLayoutPosition(
        TextInner.fields as Fields<TextProps>
      );
    }
    return hideLayoutPosition(base as Fields<TextProps>);
  },
};
