"use client";

import React, { useMemo } from "react";
import { ComponentConfig, Fields } from "@/core/types";
import { WithLayout, withLayout, hideLayoutPosition } from "../../components/Layout";
import { RADIUS_OPTIONS } from "../../content/typography-fields";
import { spacingOptions } from "../../options";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import { useBoundData } from "../../binding";
import { resolveBoundImageUrls } from "../../binding/resolve-bound-images";
import { resolveValueContextAsString } from "../../binding/resolve-value-context";
import { useActiveLanguage } from "../../locale/LanguageContext";
import { GalleryView } from "../ImageGallery/GalleryView";
import type { GalleryImageItem, ImageGalleryContentProps } from "../ImageGallery/gallery-types";

/**
 * Product-bound counterpart to `ImageGallery`: same grid/slider rendering
 * (`GalleryView`), but the `images` array is resolved at render time from the
 * bound product's own images instead of being authored per-item. One block
 * replaces the old pattern of adding a `ContentImage` per index
 * (`images[0].url`, `images[1].url`, …) — it always renders exactly as many
 * images as the bound product has.
 */
export type ProductImagesGalleryProps = WithLayout<
  Omit<ImageGalleryContentProps, "images"> & { placeholderSrc: string }
>;

const GAP_OPTIONS = spacingOptions.slice(0, 10).map((option) => ({
  label: option.label,
  value: option.value.replace(/px$/, ""),
}));

const DURATION_OPTIONS = [
  { label: "3 ثوانٍ", value: "3" },
  { label: "4 ثوانٍ", value: "4" },
  { label: "5 ثوانٍ", value: "5" },
  { label: "7 ثوانٍ", value: "7" },
  { label: "10 ثوانٍ", value: "10" },
];

const ProductImagesGalleryInner: ComponentConfig<ProductImagesGalleryProps> = {
  label: "معرض صور المنتج",
  fields: {
    mode: {
      type: "radio",
      label: "النمط",
      options: [
        { label: "شبكة", value: "grid" },
        { label: "سلايدر", value: "slider" },
      ],
    },
    placeholderSrc: {
      type: "text",
      label: "صورة بديلة (بدون منتج)",
    },
    aspectRatio: {
      type: "radio",
      label: "قياس الصورة",
      options: [
        { label: "أفقي", value: "landscape" },
        { label: "عمودي", value: "portrait" },
        { label: "مربع", value: "square" },
      ],
    },
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
    gap: themeFixedSelectField({
      label: "الفجوة",
      themeOptions: GAP_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
    gridColumns: {
      type: "select",
      label: "عدد الأعمدة",
      options: [1, 2, 3, 4, 5, 6].map((n) => ({
        label: String(n),
        value: n,
      })),
    },
    gridRows: {
      type: "select",
      label: "عدد الصفوف",
      options: [
        { label: "تلقائي", value: 0 },
        ...[1, 2, 3, 4, 5, 6].map((n) => ({ label: String(n), value: n })),
      ],
    },
    slidesPerView: {
      type: "select",
      label: "شرائح لكل شاشة",
      options: [1, 2, 3, 4].map((n) => ({
        label: String(n),
        value: n,
      })),
    },
    autoplay: {
      type: "radio",
      label: "تشغيل تلقائي",
      options: [
        { label: "نعم", value: true },
        { label: "لا", value: false },
      ],
    },
    autoplayDuration: themeFixedSelectField({
      label: "المدة",
      themeOptions: DURATION_OPTIONS,
      type: "number",
      placeholder: "بالثواني",
    }),
    showArrows: {
      type: "radio",
      label: "أسهم التنقل",
      options: [
        { label: "نعم", value: true },
        { label: "لا", value: false },
      ],
    },
  },
  defaultProps: {
    mode: "grid",
    placeholderSrc: "https://placehold.co/800x600/e2e8f0/64748b?text=Product",
    aspectRatio: "square",
    objectFit: "cover",
    radius: "theme-md",
    gap: "theme-16",
    gridColumns: 3,
    gridRows: 0,
    slidesPerView: 1,
    autoplay: true,
    autoplayDuration: "theme-4",
    showArrows: true,
  },
  render: (props) => {
    const { data } = useBoundData();
    const { language } = useActiveLanguage();

    const images = useMemo<GalleryImageItem[]>(() => {
      if (!data) return [];
      const alt =
        resolveValueContextAsString("product.title", data, { locale: language }) ?? "";
      return resolveBoundImageUrls(data).map((src) => ({ src, alt }));
    }, [data, language]);

    const displayImages: GalleryImageItem[] =
      images.length > 0 ? images : [{ src: props.placeholderSrc, alt: "" }];

    return <GalleryView {...props} images={displayImages} />;
  },
};

const FIELD_ORDER = [
  "mode",
  "placeholderSrc",
  "aspectRatio",
  "objectFit",
  "radius",
  "gap",
  "gridColumns",
  "gridRows",
  "slidesPerView",
  "autoplay",
  "autoplayDuration",
  "showArrows",
  "layout",
] as const;

const GRID_ONLY = new Set(["gridColumns", "gridRows"]);
const SLIDER_ONLY = new Set([
  "slidesPerView",
  "autoplay",
  "autoplayDuration",
  "showArrows",
]);

function resolveGalleryFields(
  fields: Record<string, unknown>,
  data: { props?: Partial<ProductImagesGalleryProps> }
): Fields<ProductImagesGalleryProps> {
  const mode = data.props?.mode ?? "grid";
  const autoplay = data.props?.autoplay ?? true;
  const result: Record<string, unknown> = {};

  for (const key of FIELD_ORDER) {
    const field = fields[key];
    if (field == null) continue;
    if (mode === "grid" && SLIDER_ONLY.has(key)) continue;
    if (mode === "slider" && GRID_ONLY.has(key)) continue;
    if (key === "autoplayDuration" && !autoplay) continue;
    result[key] = field;
  }

  return result as Fields<ProductImagesGalleryProps>;
}

const WithLayoutProductImagesGallery = withLayout(ProductImagesGalleryInner);

export const ProductImagesGallery: typeof WithLayoutProductImagesGallery = {
  ...WithLayoutProductImagesGallery,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutProductImagesGallery as {
        resolveFields?: (typeof WithLayoutProductImagesGallery)["resolveFields"];
      }
    ).resolveFields;
    const base = resolver?.(data, params);
    const apply = (f: Record<string, unknown>) =>
      hideLayoutPosition(resolveGalleryFields(f, data) as Fields<ProductImagesGalleryProps>);

    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Record<string, unknown>>).then(apply);
    }
    if (base == null) {
      return apply(ProductImagesGalleryInner.fields as unknown as Record<string, unknown>);
    }
    return apply(base as Record<string, unknown>);
  },
};
