"use client";

import React, { CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BOUND_QUERY_POLICY,
  boundQueryKeys,
  getEditorDataAdapter,
  useSampleDataInEditor,
  type CollectionPickerRef,
  type ProductsGridResourceMetadata,
} from "../../data-adapter";
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

const SkeletonCard = () => (
  <div className={getClassName("skeletonCard")} aria-hidden>
    <div className={getClassName("skeletonImage")} />
    <div className={getClassName("skeletonLine")} />
    <div className={getClassName("skeletonLine")} />
  </div>
);

export function ProductsGridClient({
  collection,
  metadata,
  columns,
  maxRows,
  gap,
  useCollection,
  isEditing = false,
}: ProductsGridClientProps) {
  const adapter = getEditorDataAdapter();
  const sampleMode = isEditing && useSampleDataInEditor();

  const apiUrl =
    metadata?.apiUrl ??
    (collection?.slug
      ? adapter.getCollectionProductsApiUrl(collection.slug)
      : null);

  const {
    data: fetched = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: boundQueryKeys.collectionProducts(apiUrl ?? ""),
    queryFn: () => adapter.fetchCollectionProducts(apiUrl!),
    enabled: Boolean(useCollection && apiUrl) && !sampleMode,
    ...BOUND_QUERY_POLICY,
  });

  const products = sampleMode ? adapter.getSampleCollectionProducts() : fetched;

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

  if (!sampleMode && isLoading) {
    return (
      <div className={getClassName()}>
        <div className={getClassName("grid")} style={gridStyle}>
          {Array.from({ length: colCount }, (_, i) => (
            <div key={i} className={getClassName("cell")}>
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!sampleMode && isError) {
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
