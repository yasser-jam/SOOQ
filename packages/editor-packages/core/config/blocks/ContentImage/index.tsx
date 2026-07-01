"use client";
/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ComponentConfig, Fields } from "@/core/types";
import { WithLayout, withLayout, hideLayoutPosition } from "../../components/Layout";
import { RADIUS_OPTIONS, resolveRadius } from "../../content/typography-fields";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import type { ValueContext } from "../../binding";
import { useBoundValue } from "../../binding";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export type ContentImageProps = WithLayout<{
  src: string;
  valueContext?: ValueContext | null;
  alt: string;
  altValueContext?: ValueContext | null;
  align: "left" | "center" | "right";
  objectFit: "contain" | "cover" | "fill" | "none" | "scale-down";
  radius: string;
  maxWidth: string;
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
    const current = value ?? "center";
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

function resolveImageRadius(
  radius: string | undefined,
  legacy?: {
    radiusMode?: "theme" | "fixed";
    radiusTheme?: string;
    radiusFixed?: string;
  }
): string {
  if (radius) return resolveRadius(radius);
  if (legacy?.radiusMode === "fixed" && legacy.radiusFixed) {
    return resolveRadius(legacy.radiusFixed);
  }
  if (legacy?.radiusMode === "theme" && legacy.radiusTheme) {
    return resolveRadius(`theme-${legacy.radiusTheme}`);
  }
  return resolveRadius("theme-md");
}

const ContentImageInner: ComponentConfig<ContentImageProps> = {
  label: "صورة",
  fields: {
    src: { type: "text", label: "رابط الصورة" },
    alt: { type: "text", label: "نص بديل" },
    align: alignField,
    objectFit: {
      type: "select",
      label: "طريقة الملاءمة",
      options: [
        { label: "تغطية", value: "cover" },
        { label: "احتواء", value: "contain" },
        { label: "ملء", value: "fill" },
        { label: "بدون", value: "none" },
        { label: "تصغير", value: "scale-down" },
      ],
    },
    radius: themeFixedSelectField({
      label: "زاوية الحدود",
      themeOptions: RADIUS_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
    maxWidth: { type: "text", label: "العرض الأقصى" },
  },
  defaultProps: {
    src: "https://placehold.co/800x450/e2e8f0/64748b?text=%D8%B5%D9%88%D8%B1%D8%A9",
    alt: "",
    align: "center",
    objectFit: "cover",
    radius: "theme-md",
    maxWidth: "100%",
  },
  resolveData: ({ props }) => {
    const legacy = props as ContentImageProps & {
      radiusMode?: "theme" | "fixed";
      radiusTheme?: string;
      radiusFixed?: string;
    };

    let radius = props.radius;
    if (!radius && legacy.radiusMode) {
      radius =
        legacy.radiusMode === "theme"
          ? `theme-${legacy.radiusTheme ?? "md"}`
          : legacy.radiusFixed?.replace(/px$/, "") || "8";
    }

    return {
      props: {
        align: props.align ?? "center",
        radius: radius ?? "theme-md",
      },
    };
  },
  render: (props) => {
    const { src, valueContext, alt, altValueContext, align, objectFit, radius, maxWidth } = props;
    const resolvedSrc = useBoundValue(src, valueContext);
    const resolvedAlt = useBoundValue(alt, altValueContext);
    const legacy = props as ContentImageProps & {
      radiusMode?: "theme" | "fixed";
      radiusTheme?: string;
      radiusFixed?: string;
    };
    const resolvedAlign = align ?? "center";
    const r = resolveImageRadius(radius, legacy);

    const placementStyle: React.CSSProperties = {
      display: "flex",
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
      justifyContent:
        resolvedAlign === "left"
          ? "flex-start"
          : resolvedAlign === "right"
            ? "flex-end"
            : "center",
    };

    return (
      <div style={placementStyle}>
        <img
          src={resolvedSrc}
          alt={resolvedAlt}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            maxWidth: maxWidth || "100%",
            objectFit,
            borderRadius: r,
          }}
        />
      </div>
    );
  },
};

const WithLayoutImage = withLayout(ContentImageInner);

export const ContentImage: typeof WithLayoutImage = {
  ...WithLayoutImage,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutImage as { resolveFields?: (typeof WithLayoutImage)["resolveFields"] }
    ).resolveFields;
    const base = resolver?.(data, params);
    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Fields<ContentImageProps>>).then((f) =>
        hideLayoutPosition(f)
      );
    }
    if (base == null) {
      return hideLayoutPosition(
        ContentImageInner.fields as Fields<ContentImageProps>
      );
    }
    return hideLayoutPosition(base as Fields<ContentImageProps>);
  },
};
