import React, { CSSProperties } from "react";
import { ComponentConfig } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { WithLayout, withLayout } from "../../components/Layout";
import { products, allCollections } from "../../data/products";
import {
  DEFAULT_PRODUCT_CARD_PROPS,
  ProductCardRender,
  type ProductCardProps,
} from "../ProductCard";
import { mockProductToCardData } from "../ProductCard/ProductCardView";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ProductsGrid", styles);

const GAP_MAP: Record<string, string> = {
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
};

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
  collection: string;
  /** Grid column count (select stores string keys "1"…"6"). */
  columns: string;
  /** Max rows to show; "0" = no row cap (all products in collection). */
  maxRows: string;
  /** Space between grid cells. */
  gap: keyof typeof GAP_MAP;
  /** Product card layout inside each cell (matches Product Card block). */
  cardVariant: ProductCardProps["variant"];
}>;

function ProductsGridRender({
  collection,
  columns,
  maxRows,
  gap,
  cardVariant,
}: ProductsGridProps) {
  const colCount = Math.min(
    6,
    Math.max(1, parseInt(String(columns), 10) || 1)
  );
  const rowCap = Math.max(0, parseInt(String(maxRows), 10) || 0);

  const inCollection = products.filter((p) => p.collections.includes(collection));
  const maxCells =
    rowCap > 0 ? Math.min(inCollection.length, rowCap * colCount) : inCollection.length;
  const list = inCollection.slice(0, maxCells);

  const gapPx = GAP_MAP[gap] ?? GAP_MAP.md;

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
    gap: gapPx,
  };

  if (list.length === 0) {
    return (
      <div className={getClassName()}>
        <div className={getClassName("empty")}>
          No products in this collection — pick another collection or add products to
          &quot;{collection}&quot; in the catalog.
        </div>
      </div>
    );
  }

  return (
    <div className={getClassName()}>
      <div className={getClassName("grid")} style={gridStyle}>
        {list.map((product) => (
          <div key={product.id} className={getClassName("cell")}>
            <ProductCardRender
              {...DEFAULT_PRODUCT_CARD_PROPS}
              variant={cardVariant}
              product={{ id: product.id, titleAr: product.title, titleEn: product.title }}
              productData={mockProductToCardData(product)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const ProductsGridInner: ComponentConfig<ProductsGridProps> = {
  label: "Products Grid",

  fields: {
    collection: {
      type: "select",
      label: "المجموعة",
      metadata: {
        helpText: "Choose which product group should appear in this grid.",
      },
      options: allCollections.map((name) => ({ label: name, value: name })),
    },
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
    collection: allCollections[0] ?? "",
    columns: "3",
    maxRows: "0",
    gap: "md",
    cardVariant: "vertical",
  },

  render: ProductsGridRender,
};

export const ProductsGrid = withLayout(ProductsGridInner);
