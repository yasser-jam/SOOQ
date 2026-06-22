import React from "react";
import { ComponentConfig } from "@/core/types";
import { WithLayout, withLayout } from "../../components/Layout";
import {
  productExternalField,
} from "../../data/products";
import type { ProductPickerRef } from "@/modules/product/product/data-store";
import { ProductInfoClient } from "./ProductInfoClient";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ProductInfoProps = WithLayout<{
  product?: ProductPickerRef | null;

  // ── Display toggles ──
  showTitle: boolean;
  showDescription: boolean;
  showCategories: boolean;
  showPrice: boolean;
  showStockBadge: boolean;

  // ── Typography ──
  titleSize: "s" | "m" | "l" | "xl";
  priceSize: "s" | "m" | "l";

  // ── Layout ──
  align: "left" | "center" | "right";
  padding: "none" | "sm" | "md" | "lg";
}>;

// ─── Config ────────────────────────────────────────────────────────────────

const ProductInfoInner: ComponentConfig<ProductInfoProps> = {
  label: "Product Info",

  fields: {
    product: productExternalField,

    // ── Display toggles ──
    showTitle: {
      type: "radio",
      label: "العنوان",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
    showDescription: {
      type: "radio",
      label: "الوصف",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
    showCategories: {
      type: "radio",
      label: "الفئات",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
    showPrice: {
      type: "radio",
      label: "السعر",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
    showStockBadge: {
      type: "radio",
      label: "شارة المخزون",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },

    // ── Typography ──
    titleSize: {
      type: "select",
      label: "حجم العنوان",
      options: [
        { label: "S", value: "s" },
        { label: "M", value: "m" },
        { label: "L", value: "l" },
        { label: "XL", value: "xl" },
      ],
    },
    priceSize: {
      type: "select",
      label: "حجم السعر",
      options: [
        { label: "S", value: "s" },
        { label: "M", value: "m" },
        { label: "L", value: "l" },
      ],
    },

    // ── Layout ──
    align: {
      type: "radio",
      label: "المحاذاة",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    padding: {
      type: "radio",
      label: "الحشوة",
      options: [
        { label: "None", value: "none" },
        { label: "S", value: "sm" },
        { label: "M", value: "md" },
        { label: "L", value: "lg" },
      ],
    },
  },

  defaultProps: {
    product: null,
    showTitle: true,
    showDescription: true,
    showCategories: true,
    showPrice: true,
    showStockBadge: true,
    titleSize: "m",
    priceSize: "m",
    align: "left",
    padding: "md",
    layout: { grow: true },
  },

  render: (props) => <ProductInfoClient {...props} />,
};

export const ProductInfo = withLayout(ProductInfoInner);
