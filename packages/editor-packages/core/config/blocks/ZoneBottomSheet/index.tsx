import React from "react";
import { ComponentConfig } from "@/core/types";
import type { Slot } from "@/core/types";
import { colorField } from "../../fields/ColorField";
import { ZoneBottomSheet as ZoneBottomSheetComponent } from "../../components/ZoneBottomSheet";

export type ZoneBottomSheetProps = {
  is_active: boolean;
  is_mobile_only: boolean;
  key: string;
  backgroundColor: string;
  borderRadius: string;
  maxHeight: string;
  overlay: boolean;
  showCloseButton: boolean;
  slot: Slot;
};

export const ZoneBottomSheet: ComponentConfig<ZoneBottomSheetProps> = {
  label: "ورقة سفلية",
  permissions: {
    insert: false,
    duplicate: false,
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
      placeholder: "cart-sheet",
    },
    backgroundColor: colorField({
      label: "لون الخلفية",
    }),
    borderRadius: {
      type: "text",
      label: "نصف القطر",
      placeholder: "16px 16px 0 0",
    },
    maxHeight: {
      type: "text",
      label: "أقصى ارتفاع",
      placeholder: "80vh",
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
      disallow: [
        "Section",
        "SiteHeader",
        "SiteFooter",
        "ZoneDrawer",
        "ZonePopup",
        "ZoneBottomSheet",
      ],
    },
  },
  defaultProps: {
    is_active: false,
    is_mobile_only: true,
    key: "cart-sheet",
    backgroundColor: "#ffffff",
    borderRadius: "16px 16px 0 0",
    maxHeight: "80vh",
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
    maxHeight,
    overlay,
    showCloseButton,
    slot: Slot,
    id,
    puck,
  }) => (
    <ZoneBottomSheetComponent
      zoneKey={zoneKey || "cart-sheet"}
      isActive={is_active}
      isMobileOnly={is_mobile_only}
      backgroundColor={backgroundColor || "#ffffff"}
      borderRadius={borderRadius || "16px 16px 0 0"}
      maxHeight={maxHeight || "80vh"}
      overlay={overlay}
      showCloseButton={showCloseButton}
      editMode={!!puck.isEditing}
      componentId={typeof id === "string" ? id : undefined}
    >
      <Slot />
    </ZoneBottomSheetComponent>
  ),
};
