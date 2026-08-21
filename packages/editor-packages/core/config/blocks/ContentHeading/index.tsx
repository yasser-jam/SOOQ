"use client";
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

export type ContentHeadingProps = WithLayout<{
  text: BilingualString | string;
  valueContext?: ValueContext | null;
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

const alignField = createAlignField({ defaultValue: "left" });

const ContentHeadingInner: ComponentConfig<ContentHeadingProps> = {
  label: "عنوان",
  fields: {
    text: bilingualTextField({
      label: "نص العنوان",
      mode: "textarea",
      contentEditable: true,
    }),
    valueContext: bindPathField({
      label: "ربط العنوان ببيانات الصفحة (اختياري)",
      placeholder: "product.title",
    }),
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
    text: { ar: "عنوان", en: "Heading" },
    valueContext: null,
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
      valueContext,
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
    const { language } = useActiveLanguage();
    const resolvedText = useBoundValue(pickLang(text, language), valueContext);
    const H = Tag[Math.min(Math.max(parseInt(level, 10) || 2, 1), 6) - 1];
    const fontCss = COMPONENT_FONT_CSS[fontFamily ?? "body"] ?? COMPONENT_FONT_CSS.body;
    const fs = resolveFontSize(fontSize ?? "theme-lg");
    const fw = resolveFontWeight(fontWeight ?? "theme-semibold");
    const lh = resolveLineHeight(lineHeight ?? "theme-normal");
    const c = resolveColor(color ?? "theme-text");
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
        {resolvedText}
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
