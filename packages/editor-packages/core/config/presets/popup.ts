import type { ZonePreset } from "./types";
import {
  createHeading,
  createParagraph,
} from "./shared";

const popupBasic: ZonePreset = {
  id: "popup-basic",
  category: "zone-popup",
  title: "نافذة منبثقة — فارغة",
  previewImage:
    "https://placehold.co/480x320/f8fafc/64748b?text=Basic+Popup",
  componentData: {
    type: "ZonePopup",
    props: {
      is_active: false,
      is_mobile_only: false,
      key: "popup-main",
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      maxWidth: "480px",
      overlay: true,
      showCloseButton: true,
      slot: [
        createHeading("عنوان النافذة", { textAlign: "center" }),
        createParagraph("أضف المحتوى الذي تريده داخل هذه المنطقة."),
      ],
    },
  },
};

export const ZONE_POPUP_PRESETS: ZonePreset[] = [popupBasic];

export const DEFAULT_ZONE_POPUP_PRESETS = [popupBasic];

export const DEFAULT_ZONE_POPUP_PRESET = popupBasic;
