import React from "react";
import { ComponentConfig } from "@/core/types";
import type { Slot } from "@/core/types";
import { colorField } from "../../fields/ColorField";
import { ZoneDrawer as ZoneDrawerComponent } from "../../components/ZoneDrawer";
import { ZONE_BLOCK_PERMISSIONS, ZONE_BLOCK_TYPES } from "../../shell-zones";
import { applyMobileEditorFieldGroups } from "../../lib/mobile-field-groups";

export type ZoneDrawerProps = {
  is_active: boolean;
  is_mobile_only: boolean;
  key: string;
  side: "left" | "right";
  backgroundColor: string;
  overlay: boolean;
  showCloseButton: boolean;
  slot: Slot;
};

export const ZoneDrawer: ComponentConfig<ZoneDrawerProps> = {
  label: "درج المنطقة",
  permissions: {
    ...ZONE_BLOCK_PERMISSIONS,
  },
  fields: {
    is_active: {
      type: "radio",
      label: "مفعّل",
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
      placeholder: "site-drawer",
    },
    side: {
      type: "radio",
      label: "الجهة",
      options: [
        { label: "Left", value: "left" },
        { label: "Right", value: "right" },
      ],
    },
    backgroundColor: colorField({
      label: "لون الخلفية",
      description: "Empty = white.",
    }),
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
    is_mobile_only: true,
    key: "site-drawer",
    side: "left",
    backgroundColor: "#ffffff",
    overlay: true,
    showCloseButton: true,
    slot: [],
  },
  resolveFields: (_data, params) =>
    applyMobileEditorFieldGroups(params.fields, params.metadata),
  render: ({
    is_active,
    is_mobile_only,
    key: zoneKey,
    side,
    backgroundColor,
    overlay,
    showCloseButton,
    slot: Slot,
    id,
    puck,
  }) => (
    <ZoneDrawerComponent
      zoneKey={zoneKey || "site-drawer"}
      isActive={is_active}
      isMobileOnly={is_mobile_only}
      side={side}
      backgroundColor={backgroundColor || "#ffffff"}
      overlay={overlay}
      showCloseButton={showCloseButton}
      editMode={!!puck.isEditing}
      componentId={typeof id === "string" ? id : undefined}
    >
      <Slot />
    </ZoneDrawerComponent>
  ),
};
