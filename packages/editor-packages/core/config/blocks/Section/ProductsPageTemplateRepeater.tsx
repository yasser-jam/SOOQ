"use client";

import React, { CSSProperties, useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type {
  ComponentDataOptionalId,
  Content,
  SlotComponent,
} from "@/core/types";
import { SlotRenderPure } from "@/core/components/SlotRender/server";
import { assignComponentIds } from "@/core/lib/assign-component-ids";
import { useAppStore } from "@/core/store";
import { conf } from "../../index";
import { useActiveLanguage } from "../../locale/LanguageContext";
import {
  getEditorDataAdapter,
  useSampleDataInEditor,
  type CollectionProductRef,
} from "../../data-adapter";
import { BoundDataProvider } from "../../binding/BoundDataContext";
import { mapCollectionProductToBoundData } from "../../binding/map-collection-product-to-bound-data";
import { useStore } from "../../store-context";

type ProductsPageTemplateRepeaterProps = {
  editableSlot: SlotComponent;
  cardTemplate: ComponentDataOptionalId | undefined;
  sectionId: string | undefined;
  isEditing: boolean;
  activeCols: number;
  gap: string;
  gridClassName: string;
};

const SKELETON_CELL_STYLE: CSSProperties = {
  minHeight: 320,
  borderRadius: 12,
  background:
    "linear-gradient(90deg, rgba(226, 232, 240, 0.5), rgba(203, 213, 225, 0.7), rgba(226, 232, 240, 0.5))",
  backgroundSize: "200% 100%",
  animation: "ProductsGrid-shimmer 1.6s ease-in-out infinite",
};

const EMPTY_STATE_STYLE: CSSProperties = {
  gridColumn: "1 / -1",
  padding: "32px 16px",
  textAlign: "center",
  color: "#6b7280",
  fontSize: 14,
  border: "1px dashed #d1d5db",
  borderRadius: 8,
  background: "#f9fafb",
};

function useLiveTemplate(
  sectionId: string | undefined,
  fallback: ComponentDataOptionalId | undefined
): ComponentDataOptionalId | undefined {
  const live = useAppStore(
    useShallow((s) => {
      if (!sectionId) return undefined;
      const section = findSectionById(s.state.data.content, sectionId);
      const templateArr = section?.props?.content;
      if (!Array.isArray(templateArr) || templateArr.length === 0) {
        return undefined;
      }
      return templateArr[0] as ComponentDataOptionalId;
    })
  );
  return live ?? fallback;
}

function findSectionById(
  content: unknown,
  sectionId: string
): { props?: Record<string, unknown> } | undefined {
  if (!Array.isArray(content)) return undefined;
  for (const item of content) {
    if (!item || typeof item !== "object") continue;
    const record = item as { type?: string; props?: Record<string, unknown> };
    if (record.props?.id === sectionId) return record;
  }
  return undefined;
}

function useProductsPageProducts(isEditing: boolean): {
  products: CollectionProductRef[];
  isLoading: boolean;
  isError: boolean;
  sampleMode: boolean;
} {
  const { productsPage } = useStore();
  const adapter = getEditorDataAdapter();
  const sampleMode = isEditing && useSampleDataInEditor();

  if (sampleMode) {
    const sample = adapter.getSampleProductsPage({ page: 0, size: 12 });
    return {
      products: sample.items,
      isLoading: false,
      isError: false,
      sampleMode: true,
    };
  }

  return {
    products: productsPage.products,
    isLoading: productsPage.isLoading,
    isError: productsPage.isError,
    sampleMode: false,
  };
}

export function ProductsPageTemplateRepeater({
  editableSlot: EditableSlot,
  cardTemplate,
  sectionId,
  isEditing,
  activeCols,
  gap,
  gridClassName,
}: ProductsPageTemplateRepeaterProps) {
  const liveTemplate = useLiveTemplate(sectionId, cardTemplate);
  const dispatch = useAppStore((s) => s.dispatch);
  const templateZone = sectionId ? `${sectionId}:content` : null;

  const selectTemplate = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      if (!isEditing || !templateZone) return;
      e.preventDefault();
      e.stopPropagation();
      dispatch({
        type: "setUi",
        ui: { itemSelector: { index: 0, zone: templateZone } },
      });
    },
    [dispatch, isEditing, templateZone]
  );

  const { products, isLoading, isError, sampleMode } =
    useProductsPageProducts(isEditing);

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${activeCols}, minmax(0, 1fr))`,
    gap,
    alignContent: "start",
    width: "100%",
  };

  const gridWrap = (children: React.ReactNode) => (
    <div className={gridClassName} style={gridStyle}>
      {children}
    </div>
  );

  if (isLoading && !sampleMode) {
    return gridWrap(
      Array.from({ length: activeCols }, (_, i) => (
        <div key={`skeleton-${i}`} style={SKELETON_CELL_STYLE} aria-hidden />
      ))
    );
  }

  if (isError && !sampleMode) {
    return gridWrap(
      <div style={EMPTY_STATE_STYLE}>تعذّر تحميل المنتجات.</div>
    );
  }

  if (products.length === 0) {
    return gridWrap(
      <div style={EMPTY_STATE_STYLE}>لا توجد منتجات مطابقة</div>
    );
  }

  return gridWrap(
    <ProductsPageTemplateCells
      products={products}
      template={liveTemplate}
      editableSlot={EditableSlot}
      isEditing={isEditing}
      onSelectTemplate={selectTemplate}
    />
  );
}

type CellsProps = {
  products: CollectionProductRef[];
  template: ComponentDataOptionalId | undefined;
  editableSlot: SlotComponent;
  isEditing: boolean;
  onSelectTemplate: (e: React.MouseEvent | React.KeyboardEvent) => void;
};

function ProductsPageTemplateCells({
  products,
  template,
  editableSlot: EditableSlot,
  isEditing,
  onSelectTemplate,
}: CellsProps) {
  const { language } = useActiveLanguage();
  const boundList = useMemo(
    () =>
      products.map((product) => ({
        product,
        boundData: mapCollectionProductToBoundData(product),
      })),
    [products]
  );

  return (
    <>
      {boundList.map(({ product, boundData }, index) => {
        const isEditableCell = isEditing && index === 0;
        return (
          <BoundDataProvider
            key={product.id}
            value={{
              data: boundData,
              isLoading: false,
              isError: false,
              metadata: null,
              language,
              selectedVariantId: null,
              setSelectedVariantId: () => {},
            }}
          >
            {isEditableCell ? (
              <EditableSlot style={{ display: "contents" }} />
            ) : (
              <CloneTemplateCell
                template={template}
                productId={product.id}
                isEditing={isEditing}
                onSelectTemplate={onSelectTemplate}
              />
            )}
          </BoundDataProvider>
        );
      })}
    </>
  );
}

type CloneTemplateCellProps = {
  template: ComponentDataOptionalId | undefined;
  productId: string;
  isEditing: boolean;
  onSelectTemplate: (e: React.MouseEvent | React.KeyboardEvent) => void;
};

function CloneTemplateCell({
  template,
  productId,
  isEditing,
  onSelectTemplate,
}: CloneTemplateCellProps) {
  const content = useMemo<Content>(() => {
    if (!template) return [];
    return [assignComponentIds(template, `products-page-card-${productId}`)];
  }, [template, productId]);

  const staticCell = (
    <SlotRenderPure
      content={content}
      zone={`products-page-card-${productId}`}
      config={conf}
      metadata={{
        puck: {
          dragRef: null,
          isEditing: false,
        },
      }}
    />
  );

  if (!isEditing) {
    return staticCell;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClickCapture={onSelectTemplate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelectTemplate(e);
      }}
      style={{
        cursor: "pointer",
        outline: "none",
      }}
    >
      {staticCell}
    </div>
  );
}
