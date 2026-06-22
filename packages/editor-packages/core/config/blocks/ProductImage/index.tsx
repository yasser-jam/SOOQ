/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ComponentConfig } from "@/core/types";
import { WithLayout, withLayout } from "../../components/Layout";
import { productExternalField } from "../../data/products";
import type { ProductPickerRef } from "@/modules/product/product/data-store";
import { ProductImageClient } from "./ProductImageClient";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ProductImageProps = WithLayout<{
  product?: ProductPickerRef | null;
  aspectRatio: "square" | "landscape" | "portrait";
  /** Fixed pixel width — useful when placed beside ProductInfo in a
   *  horizontal Group. "auto" means the block fills its flex allocation. */
  width: "auto" | "120px" | "160px" | "200px" | "240px" | "280px" | "320px" | "400px";
  borderRadius: "none" | "sm" | "md" | "lg";
  showBadges: boolean;
}>;

// ─── Config ────────────────────────────────────────────────────────────────

const ProductImageInner: ComponentConfig<ProductImageProps> = {
  label: "Product Image",

  fields: {
    product: productExternalField,

    aspectRatio: {
      type: "radio",
      label: "نسبة العرض إلى الارتفاع",
      options: [
        { label: "1:1", value: "square" },
        { label: "4:3", value: "landscape" },
        { label: "3:4", value: "portrait" },
      ],
    },
    width: {
      type: "select",
      label: "العرض",
      options: [
        { label: "Auto (fill)", value: "auto" },
        { label: "120px", value: "120px" },
        { label: "160px", value: "160px" },
        { label: "200px", value: "200px" },
        { label: "240px", value: "240px" },
        { label: "280px", value: "280px" },
        { label: "320px", value: "320px" },
        { label: "400px", value: "400px" },
      ],
    },
    borderRadius: {
      type: "radio",
      label: "زاوية الحدود",
      options: [
        { label: "None", value: "none" },
        { label: "S", value: "sm" },
        { label: "M", value: "md" },
        { label: "L", value: "lg" },
      ],
    },
    showBadges: {
      type: "radio",
      label: "الشارات",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
  },

  defaultProps: {
    product: null,
    aspectRatio: "landscape",
    width: "auto",
    borderRadius: "sm",
    showBadges: true,
  },

  render: (props) => <ProductImageClient {...props} />,
};

export const ProductImage = withLayout(ProductImageInner);
