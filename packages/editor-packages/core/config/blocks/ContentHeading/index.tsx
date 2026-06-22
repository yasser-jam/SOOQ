import React from "react";
import { ComponentConfig, Fields, DefaultComponentProps } from "@/core/types";
import { WithLayout, withLayout, hideLayoutPosition } from "../../components/Layout";
import { COMPONENT_FONT_CSS, COMPONENT_FONT_OPTIONS } from "../../theme";
import {
  resolveColor,
  colorField,
} from "../../content/color-fields";
import {
  TEXT_SIZE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  resolveFontSize,
  resolveFontWeight,
  resolveLineHeight,
} from "../../content/typography-fields";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export type ContentHeadingProps = WithLayout<{
  text: string;
  textAlign: "left" | "center" | "right";
  fontFamily: "body" | "option1" | "option2";
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  fontStyle: "normal" | "italic";
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  color: string;
}>;

const Tag = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

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
    const current = value ?? "left";
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

const ContentHeadingInner: ComponentConfig<ContentHeadingProps> = {
  label: "عنوان",
  fields: {
    text: {
      type: "textarea",
      contentEditable: true,
      label: "نص العنوان",
    },
    textAlign: alignField,
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
    fontStyle: {
      type: "radio",
      label: "نمط الخط",
      options: [
        { label: "عادي", value: "normal" },
        { label: "مائل", value: "italic" },
      ],
    },
    color: colorField,
  },
  defaultProps: {
    text: "عنوان",
    level: "2",
    textAlign: "right",
    fontFamily: "body",
    fontSize: "theme-lg",
    fontWeight: "theme-semibold",
    lineHeight: "theme-normal",
    fontStyle: "normal",
    textTransform: "none",
    color: "theme-text",
    visibility: {
      showOnMobile: true,
      showOnTablet: true,
      showOnDesktop: true,
    },
  },
  render: (props) => {
    const {
      text,
      level,
      textAlign,
      fontFamily,
      fontSize,
      fontWeight,
      lineHeight,
      fontStyle,
      textTransform,
      color,
    } = props;
    const H = Tag[Math.min(Math.max(parseInt(level, 10) || 2, 1), 6) - 1];
    const fontCss = COMPONENT_FONT_CSS[fontFamily] ?? COMPONENT_FONT_CSS.body;
    const fs = resolveFontSize(fontSize);
    const fw = resolveFontWeight(fontWeight);
    const lh = resolveLineHeight(lineHeight);
    const c = resolveColor(color);
    return (
      <H
        style={{
          fontFamily: fontCss,
          fontSize: fs,
          fontWeight: fw as any,
          lineHeight: lh,
          fontStyle,
          textTransform,
          textAlign,
          margin: 0,
          width: "100%",
          color: c,
        }}
      >
        {text}
      </H>
    );
  },
};

const WithLayoutHeading = withLayout(ContentHeadingInner);

export const ContentHeading: typeof WithLayoutHeading = {
  ...WithLayoutHeading,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutHeading as { resolveFields?: (typeof WithLayoutHeading)["resolveFields"] }
    ).resolveFields;
    const base = resolver?.(data, params);
    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Fields<ContentHeadingProps>>).then((f) =>
        hideLayoutPosition(f)
      );
    }
    if (base == null) {
      return hideLayoutPosition(
        ContentHeadingInner.fields as Fields<ContentHeadingProps>
      );
    }
    return hideLayoutPosition(base as Fields<ContentHeadingProps>);
  },
};
