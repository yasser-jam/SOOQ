/* eslint-disable @next/next/no-img-element */
import React, { CSSProperties } from "react";
import { ComponentConfig } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { withLayout, WithLayout } from "../../components/Layout";
import {
  sampleTestimonials,
  type Testimonial,
} from "../../data/testimonials";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("Testimonials", styles);

// SRS DSN-005i — Testimonials (Bound block).
// Renders customer reviews. Source can be static (declared inline in JSON) or
// CMS-managed; here we expose a `source` switch and stay JSON-friendly. When
// source = "inline", the items live in the block's own `inlineItems` array.

export type TestimonialsProps = WithLayout<{
  source: "inline" | "cms";
  layoutVariant: "grid" | "carousel" | "minimal";
  columns: 2 | 3;
  language: "ar" | "en";
  showRating: boolean;
  showAvatars: boolean;
  itemCount: number;
  inlineItems: Testimonial[];
}>;

function renderStars(rating: number) {
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(<span key={i}>{i < rating ? "★" : "☆"}</span>);
  }
  return <div className={getClassName("stars")}>{stars}</div>;
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

function TestimonialsRender({
  source,
  layoutVariant,
  columns,
  language,
  showRating,
  showAvatars,
  itemCount,
  inlineItems,
}: TestimonialsProps) {
  const baseItems: Testimonial[] =
    source === "inline" && inlineItems?.length > 0
      ? inlineItems
      : sampleTestimonials;
  const items = baseItems.slice(0, Math.max(1, itemCount));

  const cssVars: CSSProperties = {
    "--ts-cols": String(columns),
  } as CSSProperties;

  return (
    <div className={getClassName()} style={cssVars}>
      <div
        className={`${getClassName("grid")} ${
          layoutVariant === "carousel"
            ? getClassName("grid--carousel")
            : ""
        }`.trim()}
      >
        {items.map((t, idx) => {
          const text = language === "ar" && t.textAr ? t.textAr : t.text;
          const name = language === "ar" && t.nameAr ? t.nameAr : t.name;
          const role = language === "ar" && t.roleAr ? t.roleAr : t.role;
          // `id` is merchant-editable and defaults to "" — two freshly-added
          // items would collide on the React key. Prefer the stable id when
          // present, otherwise fall back to the array index.
          const key = t.id && t.id.trim() ? t.id : `item-${idx}`;
          return (
            <article
              key={key}
              className={`${getClassName("card")} ${
                layoutVariant === "minimal"
                  ? getClassName("card--minimal")
                  : ""
              }`.trim()}
            >
              {showRating && renderStars(t.rating)}
              <p className={getClassName("quote")}>“{text}”</p>
              <div className={getClassName("author")}>
                {showAvatars &&
                  (t.avatar ? (
                    <img
                      src={t.avatar}
                      alt=""
                      className={getClassName("avatar")}
                    />
                  ) : (
                    <div className={getClassName("avatarPlaceholder")}>
                      {getInitial(name)}
                    </div>
                  ))}
                <div className={getClassName("meta")}>
                  <span className={getClassName("name")}>{name}</span>
                  {role && (
                    <span className={getClassName("role")}>{role}</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

const TestimonialsInner: ComponentConfig<TestimonialsProps> = {
  label: "آراء العملاء",

  fields: {
    source: {
      type: "radio",
      label: "المصدر",
      options: [
        { label: "Inline (in this block)", value: "inline" },
        { label: "CMS / API", value: "cms" },
      ],
    },
    layoutVariant: {
      type: "radio",
      label: "التخطيط",
      options: [
        { label: "Grid", value: "grid" },
        { label: "Carousel", value: "carousel" },
        { label: "Minimal", value: "minimal" },
      ],
    },
    columns: {
      type: "radio",
      label: "الأعمدة",
      options: [
        { label: "2", value: 2 },
        { label: "3", value: 3 },
      ],
    },
    language: {
      type: "radio",
      label: "لغة العرض",
      options: [
        { label: "Arabic", value: "ar" },
        { label: "English", value: "en" },
      ],
    },
    showRating: {
      type: "radio",
      label: "التقييم بالنجوم",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
    showAvatars: {
      type: "radio",
      label: "الصور الرمزية",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
    itemCount: {
      type: "number",
      label: "عدد العناصر للعرض",
      min: 1,
      max: 12,
    },
    inlineItems: {
      type: "array",
      label: "آراء مضمّنة",
      arrayFields: {
        id: { type: "text", label: "المعرف" },
        name: { type: "text", label: "الاسم" },
        nameAr: { type: "text", label: "الاسم (AR)" },
        role: { type: "text", label: "الدور" },
        roleAr: { type: "text", label: "الدور (AR)" },
        avatar: { type: "text", label: "رابط الصورة الرمزية" },
        rating: {
          type: "select",
          label: "التقييم",
          options: [
            { label: "1 star", value: 1 },
            { label: "2 stars", value: 2 },
            { label: "3 stars", value: 3 },
            { label: "4 stars", value: 4 },
            { label: "5 stars", value: 5 },
          ],
        },
        text: { type: "textarea", label: "الاقتباس" },
        textAr: { type: "textarea", label: "الاقتباس (AR)" },
      },
      defaultItemProps: {
        id: "",
        name: "",
        nameAr: "",
        role: "",
        roleAr: "",
        avatar: "",
        rating: 5,
        text: "",
        textAr: "",
      },
      getItemSummary: (item) => (item as Testimonial).name || "Testimonial",
    },
  },

  defaultProps: {
    source: "inline",
    layoutVariant: "grid",
    columns: 3,
    language: "ar",
    showRating: true,
    showAvatars: true,
    itemCount: 3,
    inlineItems: sampleTestimonials,
  },

  render: TestimonialsRender,
};

export const Testimonials = withLayout(TestimonialsInner);
