"use client";

import React, { CSSProperties, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  BOUND_QUERY_POLICY,
  boundQueryKeys,
  getEditorDataAdapter,
  useSampleDataInEditor,
  type CollectionPickerRef,
  type CollectionProductRef,
} from "../../data-adapter";
import { BoundDataProvider } from "../../binding/BoundDataContext";
import { CollectionProductsBoundProvider } from "../../binding/CollectionProductsBoundProvider";
import { mapCollectionProductToBoundData } from "../../binding/map-collection-product-to-bound-data";

type ProductsGridTemplateRepeaterProps = {
  /**
   * Puck's live `content` slot component for the section. Rendered inside
   * cell 0 so the template is drag/select-editable in the canvas. In
   * storefront it renders exactly the same content (SlotRender under the
   * hood), just without drag chrome.
   */
  editableSlot: SlotComponent;
  /**
   * Snapshot of the section's template (content[0]), used as a fallback for
   * the storefront path where Puck's store isn't available. In edit mode
   * we prefer the live indexes read so nested edits propagate instantly.
   */
  cardTemplate: ComponentDataOptionalId | undefined;
  /** The Section's Puck block id — needed to read its slot from indexes. */
  sectionId: string | undefined;
  collection: CollectionPickerRef | null;
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

/**
 * Read the LIVE template block from Puck's raw data tree.
 *
 * `resolveData` fires on top-level prop changes but is NOT reliably fired
 * for deep child edits inside slots — so the `cardTemplate` snapshot goes
 * stale as soon as the merchant tweaks something nested (heading text,
 * button variant, etc.). Reading directly from `state.data` gives us a
 * subscription that fires on every reducer tick, keeping all N cloned
 * cells perfectly in sync with the editable one.
 *
 * We walk `state.data.content` (which holds the full nested tree — the
 * `indexes.nodes` view stores `flatData` per node without their slots
 * populated, which is why we can't just look up `indexes.zones[…]`). In
 * storefront `state.data.content` is empty and we fall back to the
 * `cardTemplate` snapshot, which resolveData populates for us there.
 */
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

function useCollectionProducts(
  collectionSlug: string | undefined,
  isEditing: boolean
): {
  products: CollectionProductRef[];
  isLoading: boolean;
  isError: boolean;
  sampleMode: boolean;
} {
  const adapter = getEditorDataAdapter();
  const sampleMode = isEditing && useSampleDataInEditor();
  const apiUrl = collectionSlug
    ? adapter.getCollectionProductsApiUrl(collectionSlug)
    : null;
  const {
    data: fetched = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: boundQueryKeys.collectionProducts(apiUrl ?? ""),
    queryFn: () => adapter.fetchCollectionProducts(apiUrl!),
    enabled: Boolean(apiUrl) && !sampleMode,
    ...BOUND_QUERY_POLICY,
  });
  const products = sampleMode
    ? adapter.getSampleCollectionProducts()
    : fetched;
  return { products, isLoading, isError, sampleMode };
}

export function ProductsGridTemplateRepeater({
  editableSlot: EditableSlot,
  cardTemplate,
  sectionId,
  collection,
  isEditing,
  activeCols,
  gap,
  gridClassName,
}: ProductsGridTemplateRepeaterProps) {
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

  const { products, isLoading, isError, sampleMode } = useCollectionProducts(
    collection?.slug,
    isEditing
  );

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

  const withCollectionProvider = (children: React.ReactNode) => (
    <CollectionProductsBoundProvider
      collectionSlug={collection?.slug ?? ""}
      isEditing={isEditing}
    >
      {children}
    </CollectionProductsBoundProvider>
  );

  if (!collection?.slug) {
    return gridWrap(
      isEditing ? (
        <div style={EMPTY_STATE_STYLE}>
          اختر مجموعة من لوحة الحقول لعرض منتجاتها.
        </div>
      ) : null
    );
  }

  if (isLoading && !sampleMode) {
    return withCollectionProvider(
      gridWrap(
        Array.from({ length: activeCols }, (_, i) => (
          <div key={`skeleton-${i}`} style={SKELETON_CELL_STYLE} aria-hidden />
        ))
      )
    );
  }

  if (isError && !sampleMode) {
    return withCollectionProvider(
      gridWrap(
        <div style={EMPTY_STATE_STYLE}>تعذّر تحميل منتجات المجموعة.</div>
      )
    );
  }

  if (products.length === 0) {
    return withCollectionProvider(
      gridWrap(
        <div style={EMPTY_STATE_STYLE}>
          لا توجد منتجات في &quot;{collection.name}&quot;.
        </div>
      )
    );
  }

  return withCollectionProvider(
    gridWrap(
      <ProductsGridTemplateCells
        products={products}
        template={liveTemplate}
        editableSlot={EditableSlot}
        isEditing={isEditing}
        onSelectTemplate={selectTemplate}
      />
    )
  );
}

type CellsProps = {
  products: CollectionProductRef[];
  template: ComponentDataOptionalId | undefined;
  editableSlot: SlotComponent;
  isEditing: boolean;
  onSelectTemplate: (e: React.MouseEvent | React.KeyboardEvent) => void;
};

function ProductsGridTemplateCells({
  products,
  template,
  editableSlot: EditableSlot,
  isEditing,
  onSelectTemplate,
}: CellsProps) {
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
              language: "ar",
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
    return [assignComponentIds(template, `products-grid-card-${productId}`)];
  }, [template, productId]);

  const staticCell = (
    <SlotRenderPure
      content={content}
      zone={`products-grid-card-${productId}`}
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

  // Edit mode: any click on a clone selects the (single) template block so
  // its fields panel opens — merchant can start editing from any card and
  // every change automatically re-renders every clone.
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
