import React from "react";
import { ComponentConfig } from "@/core/types";
import { WithLayout, withLayout } from "../../components/Layout";
import { collectionExternalField } from "../../data/products";
import {
  buildProductsGridResourceMetadata,
  type CollectionPickerRef,
  type ProductsGridResourceMetadata,
} from "@/modules/product/collection/data-store";
import {
  type ProductCardProps,
} from "../ProductCard";
import { ProductsGridClient } from "./ProductsGridClient";

const columnOptions = [1, 2, 3, 4, 5, 6].map((n) => ({
  label: n === 1 ? "1 column" : `${n} columns`,
  value: String(n),
}));

const rowOptions = [
  { label: "All rows (no limit)", value: "0" },
  ...[1, 2, 3, 4, 5, 6, 8, 10].map((n) => ({
    label: `Max ${n} row${n === 1 ? "" : "s"}`,
    value: String(n),
  })),
];

export type ProductsGridProps = WithLayout<{
  collection: CollectionPickerRef | null;
  /** Auto-populated when a collection is selected (see ProductsGrid resolveData). */
  metadata?: ProductsGridResourceMetadata | null;
  /** Grid column count (select stores string keys "1"…"6"). */
  columns: string;
  /** Max rows to show; "0" = no row cap (all products in collection). */
  maxRows: string;
  /** Space between grid cells. */
  gap: "sm" | "md" | "lg" | "xl";
  /** Product card layout inside each cell (matches Product Card block). */
  cardVariant: ProductCardProps["variant"];
}>;

const ProductsGridInner: ComponentConfig<ProductsGridProps> = {
  label: "Products Grid",

  fields: {
    collection: collectionExternalField,

    columns: {
      type: "select",
      label: "الأعمدة",
      options: columnOptions,
    },
    maxRows: {
      type: "select",
      label: "الصفوف",
      metadata: {
        helpText:
          "Limit the grid height. Use all rows for collection pages and fewer rows for home page sections.",
      },
      options: rowOptions,
    },
    gap: {
      type: "select",
      label: "المسافة بين البطاقات",
      options: [
        { label: "Small (8px)", value: "sm" },
        { label: "Medium (16px)", value: "md" },
        { label: "Large (24px)", value: "lg" },
        { label: "Extra large (32px)", value: "xl" },
      ],
    },
    cardVariant: {
      type: "radio",
      label: "تخطيط بطاقة المنتج",
      options: [
        { label: "Vertical", value: "vertical" },
        { label: "Horizontal", value: "horizontal" },
        { label: "Compact", value: "compact" },
        { label: "Featured", value: "featured" },
      ],
    },
  },

  defaultProps: {
    collection: null,
    metadata: null,
    columns: "3",
    maxRows: "0",
    gap: "md",
    cardVariant: "vertical",
  },

  resolveData: ({ props }) => {
    if (typeof props.collection === "string") {
      return { props: { collection: null, metadata: null } };
    }

    const collection = props.collection;
    if (!collection?.id) {
      if (props.metadata != null) {
        return { props: { metadata: null } };
      }
      return {};
    }

    const metadata = buildProductsGridResourceMetadata(collection);
    const current = props.metadata;

    if (
      current?.collectionId === metadata.collectionId &&
      current?.productCount === metadata.productCount &&
      current?.type === metadata.type &&
      current?.method === metadata.method &&
      current?.apiUrl === metadata.apiUrl
    ) {
      return {};
    }

    return { props: { metadata } };
  },

  render: (props) => <ProductsGridClient {...props} />,
};

export const ProductsGrid = withLayout(ProductsGridInner);
