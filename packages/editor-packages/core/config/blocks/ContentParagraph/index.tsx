"use client";
import React from "react";
import { ComponentConfig, Fields } from "@/core/types";
import { WithLayout, withLayout, hideLayoutPosition } from "../../components/Layout";
import { COMPONENT_FONT_CSS, COMPONENT_FONT_OPTIONS } from "../../theme";
import { resolveColor, colorField } from "../../content/color-fields";
import {
  TEXT_SIZE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  resolveFontSize,
  resolveFontWeight,
  resolveLineHeight,
} from "../../content/typography-fields";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import { AlignRight } from "lucide-react";
import type { ValueContext } from "../../binding";
import { useBoundValue } from "../../binding";
import { createAlignField } from "../../fields/AlignField";
import {
  bilingualTextField,
  pickLang,
  type BilingualString,
} from "../../fields/BilingualText";
import { useActiveLanguage } from "../../locale/LanguageContext";

export type ContentParagraphProps = WithLayout<{
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

const alignField = createAlignField({ defaultValue: "right" });

const ContentParagraphInner: ComponentConfig<ContentParagraphProps> = {
  label: "نص",
  fields: {
    text: bilingualTextField({
      label: "النص",
      mode: "textarea",
      contentEditable: true,
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
    text: { ar: "نص", en: "Text" },
    textAlign: "right",
    fontFamily: "body",
    fontSize: "theme-md",
    fontWeight: "theme-light",
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
    const fontCss = COMPONENT_FONT_CSS[fontFamily] ?? COMPONENT_FONT_CSS.body;
    const fs = resolveFontSize(fontSize ?? "theme-md");
    const fw = resolveFontWeight(fontWeight ?? "theme-light");
    const lh = resolveLineHeight(lineHeight ?? "theme-normal");
    const c = resolveColor(color ?? "theme-text");
    return (
      <p
        style={{
          fontFamily: fontCss,
          fontSize: fs,
          fontWeight: fw as React.CSSProperties["fontWeight"],
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
      </p>
    );
  },
};

const WithLayoutParagraph = withLayout(ContentParagraphInner);

export const ContentParagraph: typeof WithLayoutParagraph = {
  ...WithLayoutParagraph,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutParagraph as { resolveFields?: (typeof WithLayoutParagraph)["resolveFields"] }
    ).resolveFields;
    const base = resolver?.(data, params);
    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Fields<ContentParagraphProps>>).then((f) =>
        hideLayoutPosition(f)
      );
    }
    if (base == null) {
      return hideLayoutPosition(
        ContentParagraphInner.fields as Fields<ContentParagraphProps>
      );
    }
    return hideLayoutPosition(base as Fields<ContentParagraphProps>);
  },
};
