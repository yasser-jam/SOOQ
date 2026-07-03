import type { ZonePreset } from "./types";
import { createHeading, createParagraph } from "./shared";

const popupLogin: ZonePreset = {
  id: "popup-login",
  category: "zone-popup",
  title: "نافذة تسجيل الدخول",
  previewImage:
    "https://placehold.co/480x360/ffffff/64748b?text=Login+Popup",
  componentData: {
    type: "ZonePopup",
    props: {
      is_active: false,
      is_mobile_only: false,
      key: "login",
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      maxWidth: "480px",
      overlay: true,
      showCloseButton: true,
      slot: [
        createHeading("تسجيل الدخول", { textAlign: "center" }),
        createParagraph(
          "أدخل بريدك الإلكتروني أو رقم هاتفك للمتابعة.",
          { textAlign: "center" }
        ),
        {
          type: "LoginButton",
          props: {
            userNameCookie: "sooq-user-name",
            guestLabel: "تسجيل الدخول",
            showIcon: true,
            textColor: "inherit",
          },
        },
      ],
    },
  },
};

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

export const ZONE_POPUP_PRESETS: ZonePreset[] = [popupLogin, popupBasic];
