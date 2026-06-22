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
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("Accordion", styles);

type AccordionItem = {
  title: string;
  body: string;
  open: boolean;
};

export type AccordionProps = WithLayout<{
  heading: string;
  description: string;
  items: AccordionItem[];
  variant: "soft" | "outline" | "minimal";
  backgroundColor: string;
  textColor: string;
}>;

const AccordionInner: ComponentConfig<AccordionProps> = {
  label: "أكورديون",
  fields: {
    heading: { type: "text", label: "العنوان" },
    description: { type: "textarea", label: "الوصف" },
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
        title: { type: "text", label: "العنوان" },
        body: { type: "textarea", label: "المحتوى" },
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
        title: "سؤال",
        body: "إجابة",
        open: false,
      },
      getItemSummary: (item: AccordionItem) => item.title || "عنصر",
    },
  },
  defaultProps: {
    heading: "الأسئلة الشائعة",
    description: "إجابات مختصرة وعملية لتسهّل على الزائر قراءتها بسرعة.",
    variant: "soft",
    backgroundColor: "",
    textColor: "",
    items: [
      {
        title: "كم يستغرق التوصيل؟",
        body: "معظم الطلبات في سوريا تصل خلال 2-4 أيام عمل حسب المدينة.",
        open: true,
      },
      {
        title: "هل يمكن الدفع عند الاستلام؟",
        body: "نعم، الدفع عند الاستلام متاح لجميع المناطق المؤهلة.",
        open: false,
      },
      {
        title: "هل تقدّمون إرجاعاً للمنتجات؟",
        body: "يمكنك طلب الإرجاع خلال 7 أيام للمنتجات غير المستخدمة بحالتها الأصلية.",
        open: false,
      },
    ],
  },
  render: ({ heading, description, items, variant, backgroundColor, textColor }) => {
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
        {heading ? (
          <h3 className={getClassName("heading")}>{heading}</h3>
        ) : null}
        {description ? (
          <p className={getClassName("description")}>{description}</p>
        ) : null}

        <div className={getClassName("list")}>
          {(items || []).map((item, index) => {
            const title = item.title || `عنصر ${index + 1}`;
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
                  <p className={getClassName("bodyText")}>{item.body}</p>
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
