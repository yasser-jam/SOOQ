"use client";
/* eslint-disable @next/next/no-img-element */
import React from "react";
import type { WithLayout } from "../../components/Layout";
import { RADIUS_OPTIONS, resolveRadius } from "../../content/typography-fields";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import type { ValueContext } from "../../binding";
import { useBoundValue } from "../../binding";
import { bindPathField } from "../../fields/BindPathField";
import { createAlignField } from "../../fields/AlignField";
import {
  bilingualTextField,
  pickLang,
  type BilingualString,
} from "../../fields/BilingualText";
import { useActiveLanguage } from "../../locale/LanguageContext";
import {
  createBlock,
  imageBlockPlugins,
} from "../../property-plugins";

export type ContentImageProps = WithLayout<{
  src: string;
  valueContext?: ValueContext | null;
  alt: BilingualString | string;
  altValueContext?: ValueContext | null;
  align: "left" | "center" | "right";
  /**
   * Shape of the image box. `auto` keeps the source bitmap's own ratio.
   *
   * Values match the web→mobile converter's `ASPECT_RATIO_MAP`, so whatever is picked here is
   * what the app renders. It matters most inside a product card: an image in a grid cell that
   * declares no ratio is forced square by `enforcePhoneWidthContracts` (the engine cannot lay
   * out an intrinsically-sized image in a cell), and a landscape photo then gets centre-cropped
   * by `objectFit: cover`. Setting a ratio here is what overrides that.
   */
  aspectRatio?: "auto" | "landscape" | "portrait" | "square";
  objectFit: "contain" | "cover" | "fill" | "none" | "scale-down";
  radius: string;
  maxWidth: string;
}>;

/** CSS for each ratio token, mirroring ImageGallery's `ASPECT_RATIO`. `auto` is absent on purpose. */
const ASPECT_RATIO_CSS: Record<string, string> = {
  landscape: "16 / 9",
  portrait: "3 / 4",
  square: "1 / 1",
};

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
  valueContext: bindPathField({
    label: "ربط الصورة ببيانات الصفحة (اختياري)",
    placeholder: "images[0].url",
  }),
  alt: bilingualTextField({ label: "نص بديل" }),
  altValueContext: bindPathField({
    label: "ربط النص البديل ببيانات الصفحة (اختياري)",
    placeholder: "product.title",
  }),
  align: alignField,
  aspectRatio: {
    type: "select" as const,
    label: "قياس الصورة",
    options: [
      { label: "تلقائي", value: "auto" },
      { label: "أفقي", value: "landscape" },
      { label: "عمودي", value: "portrait" },
      { label: "مربع", value: "square" },
    ],
  },
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
    valueContext: null,
    alt: { ar: "", en: "" },
    altValueContext: null,
    align: "center",
    // `auto` so adding this field changes nothing for sites saved before it existed: they carry no
    // `aspectRatio`, which resolves the same as `auto` on both the canvas and the converter.
    aspectRatio: "auto",
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
    const { src, valueContext, alt, altValueContext, align, aspectRatio, objectFit, radius, maxWidth } =
      props;
    const { language } = useActiveLanguage();
    const resolvedSrc = useBoundValue(src, valueContext);
    const resolvedAlt = useBoundValue(pickLang(alt, language), altValueContext);
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
            // With `height: auto` an explicit ratio overrides the bitmap's own, so the canvas box
            // is the same shape the app will draw. Absent (`auto`) the image keeps its natural one.
            ...(ASPECT_RATIO_CSS[aspectRatio ?? "auto"]
              ? { aspectRatio: ASPECT_RATIO_CSS[aspectRatio ?? "auto"] }
              : {}),
            objectFit,
            borderRadius: r,
          }}
        />
      </div>
    );
  },
});
