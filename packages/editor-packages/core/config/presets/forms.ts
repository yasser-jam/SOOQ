import type { SectionPreset } from "./types";
import {
  createHeading,
  createInput,
  createParagraph,
  createPrimaryButton,
  createSection,
} from "./shared";

const formLogin: SectionPreset = {
  id: "form-login",
  category: "forms",
  title: "نموذج تسجيل الدخول",
  previewImage:
    "https://placehold.co/480x360/ffffff/64748b?text=Login+Form",
  componentData: createSection({
    maxWidth: "480px",
    paddingTop: "48px",
    paddingBottom: "48px",
    content: [
      createHeading("تسجيل الدخول", { textAlign: "center" }),
      createParagraph("أدخل رقم هاتفك واسمك الكامل للمتابعة.", {
        textAlign: "center",
      }),
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
  }),
};

const formVerifyOtp: SectionPreset = {
  id: "form-verify-otp",
  category: "forms",
  title: "نموذج التحقق من الرمز",
  previewImage:
    "https://placehold.co/480x360/ffffff/64748b?text=OTP+Form",
  componentData: createSection({
    maxWidth: "480px",
    paddingTop: "48px",
    paddingBottom: "48px",
    content: [
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
  }),
};

export const FORMS_PRESETS: SectionPreset[] = [formLogin, formVerifyOtp];
