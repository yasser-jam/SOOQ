import type { ZonePreset } from "./types";
import { createHeading, createParagraph } from "./shared";

const bottomSheetBasic: ZonePreset = {
  id: "bottom-sheet-basic",
  category: "zone-bottom-sheet",
  title: "ورقة سفلية — أساسية",
  previewImage:
    "https://placehold.co/640x360/f8fafc/64748b?text=Bottom+Sheet",
  componentData: {
    type: "ZoneBottomSheet",
    props: {
      is_active: false,
      is_mobile_only: true,
      zoneKey: "bs-main",
      backgroundColor: "#ffffff",
      borderRadius: "16px 16px 0 0",
      maxHeight: "80vh",
      overlay: true,
      showCloseButton: true,
      slot: [
        createHeading("عنوان الورقة", { textAlign: "center" }),
        createParagraph("محتوى قابل للتخصيص داخل الورقة السفلية."),
      ],
    },
  },
};

export const ZONE_BOTTOM_SHEET_PRESETS: ZonePreset[] = [bottomSheetBasic];
