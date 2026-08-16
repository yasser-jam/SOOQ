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
import { useSampleDataInEditor } from "../../data-adapter";
import { BoundDataProvider } from "../../binding/BoundDataContext";
import { useStore } from "../../store-context";
import {
  isStoreListDataSourceKey,
  STORE_LIST_DATA_SOURCES,
  type StoreListDataSourceKey,
} from "./store-list-data-sources";

type StoreListRepeaterProps = {
  dataSource: StoreListDataSourceKey;
  editableSlot: SlotComponent;
  cardTemplate: ComponentDataOptionalId | undefined;
  sectionId: string | undefined;
  isEditing: boolean;
  activeCols: number;
  gap: string;
  gridClassName: string;
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

function useStoreListSource(
  dataSource: StoreListDataSourceKey,
  isEditing: boolean
): {
  list: unknown[];
  isLoading: boolean;
  isError: boolean;
  sampleMode: boolean;
} {
  const store = useStore();
  const sampleInEditor = useSampleDataInEditor();
  const sampleMode = isEditing && sampleInEditor;
  const sourceConfig = STORE_LIST_DATA_SOURCES[dataSource];

  if (sampleMode) {
    return {
      list: sourceConfig.sample,
      isLoading: false,
      isError: false,
      sampleMode: true,
    };
  }

  switch (dataSource) {
    case "addresses":
      return {
        list: store.customer.addresses,
        isLoading: store.customer.isLoading,
        isError: store.customer.isError,
        sampleMode: false,
      };
    case "orders":
      return {
        list: store.orders.items,
        isLoading: store.orders.isLoading,
        isError: store.orders.isError,
        sampleMode: false,
      };
    case "order.items":
      return {
        list: store.orderDetail.order?.items ?? [],
        isLoading: false,
        isError: false,
        sampleMode: false,
      };
    case "order.timeline":
      return {
        list: store.orderDetail.order?.timeline ?? [],
        isLoading: false,
        isError: false,
        sampleMode: false,
      };
    default:
      return { list: [], isLoading: false, isError: false, sampleMode: false };
  }
}

export function StoreListRepeater({
  dataSource,
  editableSlot: EditableSlot,
  cardTemplate,
  sectionId,
  isEditing,
  activeCols,
  gap,
  gridClassName,
}: StoreListRepeaterProps) {
  if (!isStoreListDataSourceKey(dataSource)) {
    return null;
  }

  const sourceConfig = STORE_LIST_DATA_SOURCES[dataSource];
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

  const { list, isLoading, isError, sampleMode } = useStoreListSource(
    dataSource,
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

  if (isLoading && !sampleMode) {
    return gridWrap(
      Array.from({ length: activeCols }, (_, i) => (
        <div
          key={`skeleton-${i}`}
          style={{
            minHeight: 120,
            borderRadius: 12,
            background: "#f3f4f6",
          }}
          aria-hidden
        />
      ))
    );
  }

  if (isError && !sampleMode) {
    return gridWrap(
      <div style={EMPTY_STATE_STYLE}>{sourceConfig.errorMessage}</div>
    );
  }

  if (list.length === 0) {
    return gridWrap(
      <div style={EMPTY_STATE_STYLE}>{sourceConfig.emptyMessage}</div>
    );
  }

  if (!liveTemplate && !isEditing) {
    return gridWrap(
      <div style={EMPTY_STATE_STYLE}>{sourceConfig.staleTemplateMessage}</div>
    );
  }

  return gridWrap(
    <StoreListTemplateCells
      list={list}
      template={liveTemplate}
      editableSlot={EditableSlot}
      isEditing={isEditing}
      onSelectTemplate={selectTemplate}
      dataSource={dataSource}
    />
  );
}

type CellsProps = {
  list: unknown[];
  template: ComponentDataOptionalId | undefined;
  editableSlot: SlotComponent;
  isEditing: boolean;
  onSelectTemplate: (e: React.MouseEvent | React.KeyboardEvent) => void;
  dataSource: StoreListDataSourceKey;
};

function StoreListTemplateCells({
  list,
  template,
  editableSlot: EditableSlot,
  isEditing,
  onSelectTemplate,
  dataSource,
}: CellsProps) {
  const { language } = useActiveLanguage();
  const sourceConfig = STORE_LIST_DATA_SOURCES[dataSource];
  const store = useStore();

  const boundList = useMemo(
    () =>
      list.map((entry) => ({
        entry,
        entryKey: sourceConfig.keyOf(entry),
        boundData:
          dataSource === "order.items" || dataSource === "order.timeline"
            ? {
                [sourceConfig.boundKey]: entry,
                order: store.orderDetail.order,
                isReturnable: store.orderDetail.isReturnable,
              }
            : { [sourceConfig.boundKey]: entry },
      })),
    [dataSource, list, sourceConfig, store.orderDetail.isReturnable, store.orderDetail.order]
  );

  return (
    <>
      {boundList.map(({ entryKey, boundData }, index) => {
        const useLiveSlot = index === 0;
        return (
          <BoundDataProvider
            key={entryKey}
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
            {useLiveSlot ? (
              <EditableSlot style={{ display: "contents" }} />
            ) : (
              <CloneTemplateCell
                template={template}
                entryKey={entryKey}
                dataSource={dataSource}
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
  entryKey: string;
  dataSource: StoreListDataSourceKey;
  isEditing: boolean;
  onSelectTemplate: (e: React.MouseEvent | React.KeyboardEvent) => void;
};

function CloneTemplateCell({
  template,
  entryKey,
  dataSource,
  isEditing,
  onSelectTemplate,
}: CloneTemplateCellProps) {
  const zonePrefix = dataSource.replace(/\./g, "-");

  const content = useMemo<Content>(() => {
    if (!template) return [];
    return [assignComponentIds(template, `${zonePrefix}-${entryKey}`)];
  }, [template, entryKey, zonePrefix]);

  const staticCell = (
    <SlotRenderPure
      content={content}
      zone={`${zonePrefix}-${entryKey}`}
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
