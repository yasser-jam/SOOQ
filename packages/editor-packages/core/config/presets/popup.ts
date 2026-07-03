import type { ZonePreset } from "./types";
import {
  createHeading,
  createInput,
  createParagraph,
  createPrimaryButton,
} from "./shared";

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
          "أدخل رقم هاتفك واسمك الكامل للمتابعة.",
          { textAlign: "center" }
        ),
        createInput("رقم الهاتف", "phone", {
          inputType: "tel",
          placeholder: "+963...",
          required: true,
        }),
        createInput("الاسم الكامل", "fullName", {
          inputType: "text",
          placeholder: "أدخل اسمك",
          required: true,
        }),
        createPrimaryButton("تسجيل الدخول", {
          align: "center",
          destinationType: "action",
          buttonAction: "login",
        }),
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

const popupVerifyOtp: ZonePreset = {
  id: "popup-verify-otp",
  category: "zone-popup",
  title: "نافذة التحقق من الرمز",
  previewImage:
    "https://placehold.co/480x360/ffffff/64748b?text=OTP+Popup",
  componentData: {
    type: "ZonePopup",
    props: {
      is_active: true,
      is_mobile_only: false,
      key: "verify-otp",
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      maxWidth: "480px",
      overlay: true,
      showCloseButton: true,
      slot: [
        createHeading("التحقق من الرمز", { textAlign: "center" }),
        createParagraph("تم إرسال رمز التحقق إلى رقم هاتفك.", {
          textAlign: "center",
        }),
        createInput("رمز التحقق", "otp", {
          inputType: "text",
          placeholder: "------",
          required: true,
        }),
        createPrimaryButton("إرسال", {
          align: "center",
          destinationType: "action",
          buttonAction: "verifyOtp",
        }),
      ],
    },
  },
};

export const ZONE_POPUP_PRESETS: ZonePreset[] = [
  popupLogin,
  popupVerifyOtp,
  popupBasic,
];

export const DEFAULT_ZONE_POPUP_PRESETS = [popupLogin, popupVerifyOtp];

export const DEFAULT_ZONE_POPUP_PRESET = popupLogin;
