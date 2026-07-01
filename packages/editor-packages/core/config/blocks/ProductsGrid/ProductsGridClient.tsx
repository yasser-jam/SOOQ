"use client";

import React, { CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  collectionPickerKeys,
  fetchCollectionProductsFromUrl,
  getCollectionProductsApiUrl,
  type CollectionPickerRef,
  type ProductsGridResourceMetadata,
} from "@/modules/product/collection/data-store";
import { ProductCardGroupCell } from "../../components/ProductCardGroupCell";
import styles from "./styles.module.css";
import { getClassNameFactory } from "@/core/lib";

const getClassName = getClassNameFactory("ProductsGrid", styles);

const GAP_MAP: Record<string, string> = {
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
};

export type ProductsGridClientProps = {
  collection: CollectionPickerRef | null;
  metadata?: ProductsGridResourceMetadata | null;
  columns: string;
  maxRows: string;
  gap: keyof typeof GAP_MAP;
  useCollection: boolean;
  isEditing?: boolean;
};

export function ProductsGridClient({
  collection,
  metadata,
  columns,
  maxRows,
  gap,
  useCollection,
  isEditing = false,
}: ProductsGridClientProps) {
  const apiUrl =
    metadata?.apiUrl ??
    (collection?.id ? getCollectionProductsApiUrl(collection.id) : null);

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: collectionPickerKeys.products(apiUrl ?? ""),
    queryFn: () => fetchCollectionProductsFromUrl(apiUrl!),
    enabled: Boolean(useCollection && apiUrl),
    staleTime: 60_000,
  });

  const colCount = Math.min(
    6,
    Math.max(1, parseInt(String(columns), 10) || 1)
  );
  const rowCap = Math.max(0, parseInt(String(maxRows), 10) || 0);
  const gapPx = GAP_MAP[gap] ?? GAP_MAP.md;

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
    gap: gapPx,
  };

  if (!useCollection || !apiUrl) {
    return (
      <div className={getClassName()}>
        <div className={getClassName("empty")}>
          لم يتم اختيار مجموعة — اختر مجموعة من لوحة الحقول.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={getClassName()}>
        <div className={getClassName("empty")}>جاري تحميل المنتجات…</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={getClassName()}>
        <div className={getClassName("empty")}>تعذّر تحميل منتجات المجموعة.</div>
      </div>
    );
  }

  const maxCells =
    rowCap > 0 ? Math.min(products.length, rowCap * colCount) : products.length;
  const list = products.slice(0, maxCells);

  if (list.length === 0) {
    return (
      <div className={getClassName()}>
        <div className={getClassName("empty")}>
          لا توجد منتجات في &quot;{collection?.name ?? metadata?.collectionId}&quot;.
        </div>
      </div>
    );
  }

  return (
    <div className={getClassName()}>
      <div className={getClassName("grid")} style={gridStyle}>
        {list.map((product) => (
          <div key={product.id} className={getClassName("cell")}>
            <ProductCardGroupCell product={product} isEditing={isEditing} />
          </div>
        ))}
      </div>
    </div>
  );
}
