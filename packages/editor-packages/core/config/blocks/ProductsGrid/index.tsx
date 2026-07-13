import React from "react";
import { ComponentConfig } from "@/core/types";
import { WithLayout, withLayout } from "../../components/Layout";
import { sectionCollectionPickerField } from "../../fields/CollectionPickerField";
import {
  getEditorDataAdapter,
  type CollectionPickerRef,
  type ProductsGridResourceMetadata,
} from "../../data-adapter";
import { ProductsGridClient } from "./ProductsGridClient";
import { resolveMetadataProp } from "../../lib/resolve-metadata-prop";

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
}>;

const ProductsGridInner: ComponentConfig<ProductsGridProps> = {
  label: "شبكة المنتجات",

  fields: {
    collection: sectionCollectionPickerField,

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
  },

  defaultProps: {
    collection: null,
    metadata: null,
    columns: "3",
    maxRows: "0",
    gap: "md",
  },

  resolveData: ({ props }) => {
    if (typeof props.collection === "string") {
      return { props: { collection: null, metadata: null } };
    }

    const collection = props.collection;
    const metadata = collection?.slug
      ? getEditorDataAdapter().buildProductsGridResourceMetadata(collection)
      : null;

    return resolveMetadataProp(props.metadata, metadata);
  },

  render: (props) => {
    const { collection, metadata, columns, maxRows, gap, puck } = props;
    const useCollection = Boolean(collection?.slug || metadata?.collectionSlug);

    return (
      <ProductsGridClient
        collection={collection}
        metadata={metadata}
        columns={columns}
        maxRows={maxRows}
        gap={gap}
        useCollection={useCollection}
        isEditing={puck?.isEditing === true}
      />
    );
  },
};

export const ProductsGrid = withLayout(ProductsGridInner);
