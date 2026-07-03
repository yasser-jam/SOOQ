import React from "react";
import { ComponentConfig } from "@/core/types";
import type { Slot } from "@/core/types";
import { colorField } from "../../fields/ColorField";
import { ZonePopup as ZonePopupComponent } from "../../components/ZonePopup";
import { ZONE_BLOCK_PERMISSIONS, ZONE_BLOCK_TYPES } from "../../shell-zones";

export type ZonePopupProps = {
  is_active: boolean;
  is_mobile_only: boolean;
  key: string;
  backgroundColor: string;
  borderRadius: string;
  maxWidth: string;
  overlay: boolean;
  showCloseButton: boolean;
  slot: Slot;
};

export const ZonePopup: ComponentConfig<ZonePopupProps> = {
  label: "نافذة منبثقة",
  permissions: {
    ...ZONE_BLOCK_PERMISSIONS,
  },
  fields: {
    is_active: {
      type: "radio",
      label: "مفعّلة",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    is_mobile_only: {
      type: "radio",
      label: "الجوال فقط",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    key: {
      type: "text",
      label: "مفتاح الحدث",
      placeholder: "login",
    },
    backgroundColor: colorField({
      label: "لون الخلفية",
    }),
    borderRadius: {
      type: "text",
      label: "نصف القطر",
      placeholder: "12px",
    },
    maxWidth: {
      type: "text",
      label: "أقصى عرض",
      placeholder: "480px",
    },
    overlay: {
      type: "radio",
      label: "تعتيم الخلفية",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    showCloseButton: {
      type: "radio",
      label: "إظهار زر الإغلاق",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    slot: {
      type: "slot",
      disallow: ["Section", ...ZONE_BLOCK_TYPES],
    },
  },
  defaultProps: {
    is_active: false,
    is_mobile_only: false,
    key: "login",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    maxWidth: "480px",
    overlay: true,
    showCloseButton: true,
    slot: [],
  },
  render: ({
    is_active,
    is_mobile_only,
    key: zoneKey,
    backgroundColor,
    borderRadius,
    maxWidth,
    overlay,
    showCloseButton,
    slot: Slot,
    id,
    puck,
  }) => (
    <ZonePopupComponent
      zoneKey={zoneKey || "login"}
      isActive={is_active}
      isMobileOnly={is_mobile_only}
      backgroundColor={backgroundColor || "#ffffff"}
      borderRadius={borderRadius || "12px"}
      maxWidth={maxWidth || "480px"}
      overlay={overlay}
      showCloseButton={showCloseButton}
      editMode={!!puck.isEditing}
      componentId={typeof id === "string" ? id : undefined}
    >
      <Slot />
    </ZonePopupComponent>
  ),
};
