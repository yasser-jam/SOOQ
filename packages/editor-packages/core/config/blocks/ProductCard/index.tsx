import React from "react";
import { ComponentConfig, Fields } from "@/core/types";
import { WithLayout, withLayout } from "../../components/Layout";
import { productExternalField, buildProductResourceMetadata } from "@/modules/product/product/data-store";
import { colorField } from "../../content/color-fields";
import { RADIUS_OPTIONS } from "../../content/typography-fields";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import { ProductCardView } from "./ProductCardView";
import type { ProductCardDisplayProps } from "./types";

export type ProductCardProps = WithLayout<ProductCardDisplayProps>;

const SHOW_HIDE = [
  { label: "إظهار", value: true },
  { label: "إخفاء", value: false },
];

export const DEFAULT_PRODUCT_CARD_PROPS: Omit<ProductCardProps, "product" | "layout"> = {
  variant: "vertical",
  radius: "theme-md",
  showTags: true,
  showVariants: true,
  showDescription: true,
  showCategories: true,
  showActionButtons: true,
  actionButtonsFirst: false,
  showAddToCart: true,
  showViewDetails: true,
  showFavoriteButton: true,
  actionButtonVariantMode: "variant",
  actionButtonVariant: "primary",
  actionButtonVariantSize: "md",
  actionRadius: "theme-md",
  actionBgColor: "theme-primary",
  actionTextColor: "theme-surface",
  titleColor: "theme-text",
  descriptionColor: "theme-neutral",
  language: "ar",
};

export type ProductCardRenderProps = ProductCardProps & {
  puck?: { isEditing?: boolean };
  productData?: import("./types").ProductCardData | null;
};

export function ProductCardRender(props: ProductCardRenderProps) {
  const { puck, productData, ...rest } = props;
  return (
    <ProductCardView
      {...rest}
      productData={productData}
      isEditing={puck?.isEditing === true}
    />
  );
}

const ProductCardInner: ComponentConfig<ProductCardProps> = {
  label: "بطاقة المنتج",

  fields: {
    product: productExternalField,

    variant: {
      type: "radio",
      label: "شكل البطاقة",
      options: [
        { label: "عمودي", value: "vertical" },
        { label: "أفقي", value: "horizontal" },
        { label: "مضغوط", value: "compact" },
        { label: "مضغوط مع صورة خلفية", value: "featured" },
      ],
    },

    radius: themeFixedSelectField({
      label: "زاوية الحدود",
      themeOptions: RADIUS_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),

    language: {
      type: "radio",
      label: "لغة العرض",
      options: [
        { label: "العربية", value: "ar" },
        { label: "English", value: "en" },
      ],
    },

    showTags: {
      type: "radio",
      label: "إظهار الوسوم",
      options: SHOW_HIDE,
    },
    showVariants: {
      type: "radio",
      label: "إظهار الأصناف الفرعية",
      options: SHOW_HIDE,
    },
    showDescription: {
      type: "radio",
      label: "إظهار الوصف",
      options: SHOW_HIDE,
    },
    showCategories: {
      type: "radio",
      label: "إظهار الفئات",
      options: SHOW_HIDE,
    },

    showActionButtons: {
      type: "radio",
      label: "إظهار أزرار الإجراء",
      options: SHOW_HIDE,
    },
    actionButtonsFirst: {
      type: "radio",
      label: "عرض الأزرار أولاً",
      options: [
        { label: "نعم", value: true },
        { label: "لا", value: false },
      ],
    },
    showAddToCart: {
      type: "radio",
      label: "زر إضافة إلى السلة",
      options: SHOW_HIDE,
    },
    showViewDetails: {
      type: "radio",
      label: "زر عرض التفاصيل",
      options: SHOW_HIDE,
    },
    showFavoriteButton: {
      type: "radio",
      label: "زر المفضلة",
      options: SHOW_HIDE,
    },

    actionButtonVariantMode: {
      type: "radio",
      label: "نمط أزرار الإجراء",
      options: [
        { label: "استخدام نمط", value: "variant" },
        { label: "تخصيص يدوي", value: "fixed" },
      ],
    },
    actionButtonVariant: {
      type: "select",
      label: "النمط",
      options: [
        { label: "أساسي", value: "primary" },
        { label: "ثانوي", value: "secondary" },
        { label: "خطأ", value: "error" },
      ],
    },
    actionButtonVariantSize: {
      type: "select",
      label: "حجم النمط",
      options: [
        { label: "صغير", value: "sm" },
        { label: "متوسط", value: "md" },
        { label: "كبير", value: "lg" },
      ],
    },
    actionRadius: themeFixedSelectField({
      label: "زاوية أزرار الإجراء",
      themeOptions: RADIUS_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
    actionBgColor: { ...colorField, label: "لون خلفية الزر" },
    actionTextColor: { ...colorField, label: "لون نص الزر" },

    titleColor: { ...colorField, label: "لون العنوان" },
    descriptionColor: { ...colorField, label: "لون الوصف" },
  },

  defaultProps: {
    product: null,
    metadata: null,
    ...DEFAULT_PRODUCT_CARD_PROPS,
  },

  resolveData: ({ props }) => {
    const productId = props.product?.id;

    if (!productId) {
      if (props.metadata != null) {
        return { props: { metadata: null } };
      }
      return {};
    }

    const metadata = buildProductResourceMetadata(productId);
    const current = props.metadata;

    if (
      current?.id === metadata.id &&
      current?.type === metadata.type &&
      current?.method === metadata.method &&
      current?.apiUrl === metadata.apiUrl
    ) {
      return {};
    }

    return { props: { metadata } };
  },

  render: ProductCardRender,
};

const FIELD_ORDER = [
  "product",
  "variant",
  "radius",
  "language",
  "showTags",
  "showVariants",
  "showDescription",
  "showCategories",
  "showActionButtons",
  "actionButtonsFirst",
  "showAddToCart",
  "showViewDetails",
  "showFavoriteButton",
  "actionButtonVariantMode",
  "actionButtonVariant",
  "actionButtonVariantSize",
  "actionRadius",
  "actionBgColor",
  "actionTextColor",
  "titleColor",
  "descriptionColor",
  "layout",
] as const;

function resolveProductCardFields(
  fields: Record<string, unknown>,
  data: { props?: Partial<ProductCardProps> }
): Fields<ProductCardProps> {
  const showActions = data.props?.showActionButtons ?? true;
  const actionMode = data.props?.actionButtonVariantMode ?? "variant";
  const result: Record<string, unknown> = {};

  for (const key of FIELD_ORDER) {
    const field = fields[key];
    if (field == null) continue;

    if (!showActions && ["actionButtonsFirst", "showAddToCart", "showViewDetails", "showFavoriteButton", "actionButtonVariantMode", "actionButtonVariant", "actionButtonVariantSize", "actionRadius", "actionBgColor", "actionTextColor"].includes(key)) {
      continue;
    }

    if (actionMode === "variant" && ["actionRadius", "actionBgColor", "actionTextColor"].includes(key)) {
      continue;
    }

    if (actionMode === "fixed" && ["actionButtonVariant", "actionButtonVariantSize"].includes(key)) {
      continue;
    }

    result[key] = field;
  }

  return result as Fields<ProductCardProps>;
}

const WithLayoutCard = withLayout(ProductCardInner);

export const ProductCard: typeof WithLayoutCard = {
  ...WithLayoutCard,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutCard as { resolveFields?: (typeof WithLayoutCard)["resolveFields"] }
    ).resolveFields;
    const base = resolver?.(data, params);
    const apply = (fields: Record<string, unknown>) =>
      resolveProductCardFields(fields, data);

    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Record<string, unknown>>).then(apply);
    }
    if (base == null) {
      return apply(ProductCardInner.fields as unknown as Record<string, unknown>);
    }
    return apply(base as Record<string, unknown>);
  },
};

export type { ProductCardDisplayProps } from "./types";
