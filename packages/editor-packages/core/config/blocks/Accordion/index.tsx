"use client";

import React from "react";
import { getClassNameFactory } from "@/core/lib";
import type { ComponentConfig, Fields } from "@/core/types";
import {
  WithLayout,
  withLayout,
  hideLayoutBorder,
  hideLayoutPosition,
} from "../../components/Layout";
import { colorField } from "../../fields/ColorField";
import {
  bilingualTextField,
  pickLang,
  type BilingualString,
} from "../../fields/BilingualText";
import { useActiveLanguage } from "../../locale/LanguageContext";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("Accordion", styles);

type AccordionItem = {
  title: BilingualString | string;
  body: BilingualString | string;
  open: boolean;
};

export type AccordionProps = WithLayout<{
  heading: BilingualString | string;
  description: BilingualString | string;
  items: AccordionItem[];
  variant: "soft" | "outline" | "minimal";
  backgroundColor: string;
  textColor: string;
}>;

const AccordionInner: ComponentConfig<AccordionProps> = {
  label: "أكورديون",
  fields: {
    heading: bilingualTextField({ label: "العنوان" }),
    description: bilingualTextField({ label: "الوصف", mode: "textarea" }),
    variant: {
      type: "radio",
      label: "النمط",
      options: [
        { label: "ناعم", value: "soft" },
        { label: "حدود", value: "outline" },
        { label: "مبسّط", value: "minimal" },
      ],
    },
    backgroundColor: colorField({
      label: "لون الخلفية",
      description: "اتركه فارغاً لاستخدام الافتراضي من الثيم.",
    }),
    textColor: colorField({
      label: "لون النص",
      description: "اتركه فارغاً لاستخدام الافتراضي من الثيم.",
    }),
    items: {
      type: "array",
      label: "العناصر",
      arrayFields: {
        title: bilingualTextField({ label: "العنوان" }),
        body: bilingualTextField({ label: "المحتوى", mode: "textarea" }),
        open: {
          type: "radio",
          label: "مفتوح افتراضياً",
          options: [
            { label: "لا", value: false },
            { label: "نعم", value: true },
          ],
        },
      },
      defaultItemProps: {
        title: { ar: "سؤال", en: "Question" },
        body: { ar: "إجابة", en: "Answer" },
        open: false,
      },
      getItemSummary: (item: AccordionItem) =>
        pickLang(item.title) || "عنصر",
    },
  },
  defaultProps: {
    heading: { ar: "الأسئلة الشائعة", en: "FAQ" },
    description: {
      ar: "إجابات مختصرة وعملية لتسهّل على الزائر قراءتها بسرعة.",
      en: "Short, practical answers that are easy to scan.",
    },
    variant: "soft",
    backgroundColor: "",
    textColor: "",
    items: [
      {
        title: {
          ar: "كم يستغرق التوصيل؟",
          en: "How long does delivery take?",
        },
        body: {
          ar: "معظم الطلبات في سوريا تصل خلال 2-4 أيام عمل حسب المدينة.",
          en: "Most orders in Syria arrive within 2–4 business days depending on the city.",
        },
        open: true,
      },
      {
        title: {
          ar: "هل يمكن الدفع عند الاستلام؟",
          en: "Is cash on delivery available?",
        },
        body: {
          ar: "نعم، الدفع عند الاستلام متاح لجميع المناطق المؤهلة.",
          en: "Yes — cash on delivery is available in all eligible areas.",
        },
        open: false,
      },
      {
        title: {
          ar: "هل تقدّمون إرجاعاً للمنتجات؟",
          en: "Do you accept returns?",
        },
        body: {
          ar: "يمكنك طلب الإرجاع خلال 7 أيام للمنتجات غير المستخدمة بحالتها الأصلية.",
          en: "You can request a return within 7 days for unused products in original condition.",
        },
        open: false,
      },
    ],
  },
  render: ({
    heading,
    description,
    items,
    variant,
    backgroundColor,
    textColor,
  }) => {
    const { language } = useActiveLanguage();
    const headingText = pickLang(heading, language);
    const descriptionText = pickLang(description, language);

    const paletteStyle = {
      "--Accordion-bg": backgroundColor || "#ffffff",
      "--Accordion-text": textColor || "#0f172a",
    } as React.CSSProperties;

    const className = getClassName({
      soft: variant === "soft",
      outline: variant === "outline",
      minimal: variant === "minimal",
    });

    return (
      <section className={className} style={paletteStyle}>
        {headingText ? (
          <h3 className={getClassName("heading")}>{headingText}</h3>
        ) : null}
        {descriptionText ? (
          <p className={getClassName("description")}>{descriptionText}</p>
        ) : null}

        <div className={getClassName("list")}>
          {(items || []).map((item, index) => {
            const title =
              pickLang(item.title, language) || `عنصر ${index + 1}`;
            const body = pickLang(item.body, language);
            return (
              <details
                key={`${title}-${index}`}
                className={getClassName("item")}
                open={!!item.open}
              >
                <summary className={getClassName("summary")}>
                  <span>{title}</span>
                  <span className={getClassName("chevron")} aria-hidden />
                </summary>

                <div className={getClassName("body")}>
                  <p className={getClassName("bodyText")}>{body}</p>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    );
  },
};

const WithLayoutAccordion = withLayout(AccordionInner);

export const Accordion: typeof WithLayoutAccordion = {
  ...WithLayoutAccordion,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutAccordion as {
        resolveFields?: (typeof WithLayoutAccordion)["resolveFields"];
      }
    ).resolveFields;
    const base = resolver?.(data, params);
    const apply = (f: Record<string, unknown>) =>
      hideLayoutBorder(
        hideLayoutPosition(f as Fields<AccordionProps>)
      );

    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Record<string, unknown>>).then(apply);
    }
    if (base == null) {
      return apply(AccordionInner.fields as unknown as Record<string, unknown>);
    }
    return apply(base as Record<string, unknown>);
  },
};
