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
import type { CustomerAddress } from "../../store-context";
import { useStore } from "../../store-context";

type CustomerAddressesTemplateRepeaterProps = {
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

export const SAMPLE_CUSTOMER_ADDRESSES: CustomerAddress[] = [
  {
    addressId: "sample-address-1",
    label: "HOME",
    recipientName: "أحمد محمد",
    recipientPhone: "+963991234567",
    governorate: "دمشق",
    city: "المزة",
    streetAddress: "شارع الجلاء",
    notes: null,
    latitude: 33.5138,
    longitude: 36.2765,
    isDefault: true,
    createdAt: "2025-06-01T08:00:00Z",
    updatedAt: "2025-06-01T08:00:00Z",
  },
  {
    addressId: "sample-address-2",
    label: "WORK",
    recipientName: "أحمد محمد",
    recipientPhone: "+963991234567",
    governorate: "ريف دمشق",
    city: "جرمانا",
    streetAddress: "شارع الثورة",
    notes: "بجانب المدرسة",
    latitude: 33.485,
    longitude: 36.345,
    isDefault: false,
    createdAt: "2025-08-10T12:00:00Z",
    updatedAt: "2025-08-10T12:00:00Z",
  },
];

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

function useCustomerAddresses(isEditing: boolean): {
  addresses: CustomerAddress[];
  isLoading: boolean;
  isError: boolean;
  sampleMode: boolean;
} {
  const { customer } = useStore();
  const sampleMode = isEditing && useSampleDataInEditor();

  if (sampleMode) {
    return {
      addresses: SAMPLE_CUSTOMER_ADDRESSES,
      isLoading: false,
      isError: false,
      sampleMode: true,
    };
  }

  return {
    addresses: customer.addresses,
    isLoading: customer.isLoading,
    isError: customer.isError,
    sampleMode: false,
  };
}

export function CustomerAddressesTemplateRepeater({
  editableSlot: EditableSlot,
  cardTemplate,
  sectionId,
  isEditing,
  activeCols,
  gap,
  gridClassName,
}: CustomerAddressesTemplateRepeaterProps) {
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

  const { addresses, isLoading, isError, sampleMode } =
    useCustomerAddresses(isEditing);

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
      <div style={EMPTY_STATE_STYLE}>تعذّر تحميل العناوين.</div>
    );
  }

  if (addresses.length === 0) {
    return gridWrap(
      <div style={EMPTY_STATE_STYLE}>لا توجد عناوين محفوظة بعد.</div>
    );
  }

  return gridWrap(
    <CustomerAddressesTemplateCells
      addresses={addresses}
      template={liveTemplate}
      editableSlot={EditableSlot}
      isEditing={isEditing}
      onSelectTemplate={selectTemplate}
    />
  );
}

type CellsProps = {
  addresses: CustomerAddress[];
  template: ComponentDataOptionalId | undefined;
  editableSlot: SlotComponent;
  isEditing: boolean;
  onSelectTemplate: (e: React.MouseEvent | React.KeyboardEvent) => void;
};

function CustomerAddressesTemplateCells({
  addresses,
  template,
  editableSlot: EditableSlot,
  isEditing,
  onSelectTemplate,
}: CellsProps) {
  const { language } = useActiveLanguage();
  const boundList = useMemo(
    () =>
      addresses.map((address) => ({
        address,
        boundData: { address },
      })),
    [addresses]
  );

  return (
    <>
      {boundList.map(({ address, boundData }, index) => {
        const isEditableCell = isEditing && index === 0;
        return (
          <BoundDataProvider
            key={address.addressId}
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
                addressId={address.addressId}
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
  addressId: string;
  isEditing: boolean;
  onSelectTemplate: (e: React.MouseEvent | React.KeyboardEvent) => void;
};

function CloneTemplateCell({
  template,
  addressId,
  isEditing,
  onSelectTemplate,
}: CloneTemplateCellProps) {
  const content = useMemo<Content>(() => {
    if (!template) return [];
    return [assignComponentIds(template, `customer-address-${addressId}`)];
  }, [template, addressId]);

  const staticCell = (
    <SlotRenderPure
      content={content}
      zone={`customer-address-${addressId}`}
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
