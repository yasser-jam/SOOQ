import React from "react";
import { ComponentConfig, Fields } from "@/core/types";
import { WithLayout, withLayout, hideLayoutPosition } from "../../components/Layout";
import { RADIUS_OPTIONS } from "../../content/typography-fields";
import { spacingOptions } from "../../options";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import { GalleryView } from "./GalleryView";
import type { GalleryImageItem, ImageGalleryContentProps } from "./gallery-types";

export type { GalleryImageItem } from "./gallery-types";

export type ImageGalleryProps = WithLayout<ImageGalleryContentProps>;

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

const defaultImage = (text: string): GalleryImageItem => ({
  src: `https://placehold.co/800x600/e2e8f0/64748b?text=${encodeURIComponent(text)}`,
  alt: "",
});

const ImageGalleryInner: ComponentConfig<ImageGalleryProps> = {
  label: "معرض الصور",
  fields: {
    mode: {
      type: "radio",
      label: "النمط",
      options: [
        { label: "شبكة", value: "grid" },
        { label: "سلايدر", value: "slider" },
      ],
    },
    images: {
      type: "array",
      label: "الصور",
      arrayFields: {
        src: { type: "text", label: "رابط الصورة" },
        alt: { type: "text", label: "نص بديل" },
      },
      defaultItemProps: defaultImage("صورة"),
      getItemSummary: (_item, i) => `صورة ${(i ?? 0) + 1}`,
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
    images: [defaultImage("1"), defaultImage("2"), defaultImage("3")],
    aspectRatio: "landscape",
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
  resolveData: ({ props }) => {
    const legacy = props as ImageGalleryProps & {
      images?: Array<
        GalleryImageItem & {
          width?: string;
          height?: string;
          maxWidth?: string;
          radiusMode?: string;
          radiusTheme?: string;
          radiusFixed?: string;
        }
      >;
    };

    const images = (legacy.images ?? []).map((item) => ({
      src: item.src,
      alt: item.alt ?? "",
    }));

    let radius = props.radius;
    if (!radius && legacy.images?.[0]) {
      const first = legacy.images[0] as {
        radiusMode?: string;
        radiusTheme?: string;
        radiusFixed?: string;
      };
      if (first.radiusMode === "theme") {
        radius = `theme-${first.radiusTheme ?? "md"}`;
      } else if (first.radiusFixed) {
        radius = first.radiusFixed.replace(/px$/, "");
      }
    }

    let gap = props.gap;
    if (gap && !gap.startsWith("theme-") && gap.endsWith("px")) {
      const n = gap.replace(/px$/, "");
      gap = GAP_OPTIONS.some((o) => o.value === n) ? `theme-${n}` : n;
    }

    return {
      props: {
        mode: props.mode ?? "grid",
        radius: radius ?? "theme-md",
        gap: gap ?? "theme-16",
        autoplayDuration: props.autoplayDuration ?? "theme-4",
      },
    };
  },
  render: (props) => <GalleryView {...props} />,
};

const FIELD_ORDER = [
  "mode",
  "images",
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
  data: { props?: Partial<ImageGalleryProps> }
): Fields<ImageGalleryProps> {
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

  return result as Fields<ImageGalleryProps>;
}

const WithLayoutGallery = withLayout(ImageGalleryInner);

export const ImageGallery: typeof WithLayoutGallery = {
  ...WithLayoutGallery,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutGallery as { resolveFields?: (typeof WithLayoutGallery)["resolveFields"] }
    ).resolveFields;
    const base = resolver?.(data, params);
    const apply = (f: Record<string, unknown>) =>
      hideLayoutPosition(resolveGalleryFields(f, data) as Fields<ImageGalleryProps>);

    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Record<string, unknown>>).then(apply);
    }
    if (base == null) {
      return apply(ImageGalleryInner.fields as unknown as Record<string, unknown>);
    }
    return apply(base as Record<string, unknown>);
  },
};
