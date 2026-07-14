"use client";
/* eslint-disable @next/next/no-img-element */
import React from "react";
import type { WithLayout } from "../../components/Layout";
import { RADIUS_OPTIONS, resolveRadius } from "../../content/typography-fields";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import type { ValueContext } from "../../binding";
import { useBoundValue } from "../../binding";
import { createAlignField } from "../../fields/AlignField";
import {
  createBlock,
  imageBlockPlugins,
} from "../../property-plugins";

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

const alignField = createAlignField({ defaultValue: "center" });

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

const imageFields = {
  src: { type: "text" as const, label: "رابط الصورة" },
  alt: { type: "text" as const, label: "نص بديل" },
  align: alignField,
  objectFit: {
    type: "select" as const,
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
  maxWidth: { type: "text" as const, label: "العرض الأقصى" },
};

export const ContentImage = createBlock<ContentImageProps>({
  label: "صورة",
  propertyPlugins: imageBlockPlugins(imageFields),
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
});
