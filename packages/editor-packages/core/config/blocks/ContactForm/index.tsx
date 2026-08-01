import React from "react";
import { ComponentConfig } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { withLayout, WithLayout } from "../../components/Layout";
import {
  bilingualTextField,
  pickLang,
  type BilingualString,
} from "../../fields/BilingualText";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ContactForm", styles);

// SRS DSN-005j — Contact Form (Bound block).
// Renders a form whose submissions hit the tenant's contact endpoint.
// store_config.json carries display config + the destination endpoint key
// (resolved server-side); never raw email addresses or credentials.

export type ContactFormProps = WithLayout<{
  title: BilingualString;
  subtitle: BilingualString;
  language: "ar" | "en";
  showPhone: boolean;
  showSubject: boolean;
  requirePhone: boolean;
  submitLabel: BilingualString | string;
  successMessage: BilingualString | string;
  enableCaptcha: boolean;
  submitWidth: "auto" | "full";
}>;

function ContactFormRender({
  title,
  subtitle,
  language,
  showPhone,
  showSubject,
  requirePhone,
  submitLabel,
  enableCaptcha,
  submitWidth,
}: ContactFormProps) {
  const titleText = pickLang(title, language);
  const subtitleText = pickLang(subtitle, language);
  const submitLabelText = pickLang(submitLabel, language);

  return (
    <div className={getClassName()}>
      {titleText && <h3 className={getClassName("title")}>{titleText}</h3>}
      {subtitleText && (
        <p className={getClassName("subtitle")}>{subtitleText}</p>
      )}

      <form
        className={getClassName("form")}
        onSubmit={(e) => {
          // Submission is wired up by the consuming renderer (web/mobile),
          // not by the editor preview.
          e.preventDefault();
        }}
      >
        <div className={getClassName("row")}>
          <div className={getClassName("field")}>
            <label className={getClassName("label")} htmlFor="cf-name">
              Name
              <span className={getClassName("required")}>*</span>
            </label>
            <input
              id="cf-name"
              name="name"
              type="text"
              required
              className={getClassName("input")}
              autoComplete="name"
            />
          </div>
          <div className={getClassName("field")}>
            <label className={getClassName("label")} htmlFor="cf-email">
              Email
              <span className={getClassName("required")}>*</span>
            </label>
            <input
              id="cf-email"
              name="email"
              type="email"
              required
              className={getClassName("input")}
              autoComplete="email"
            />
          </div>
        </div>

        {showPhone && (
          <div className={getClassName("field")}>
            <label className={getClassName("label")} htmlFor="cf-phone">
              Phone
              {requirePhone && (
                <span className={getClassName("required")}>*</span>
              )}
            </label>
            <input
              id="cf-phone"
              name="phone"
              type="tel"
              required={requirePhone}
              className={getClassName("input")}
              autoComplete="tel"
              dir="ltr"
            />
          </div>
        )}

        {showSubject && (
          <div className={getClassName("field")}>
            <label className={getClassName("label")} htmlFor="cf-subject">
              Subject
            </label>
            <input
              id="cf-subject"
              name="subject"
              type="text"
              className={getClassName("input")}
            />
          </div>
        )}

        <div className={getClassName("field")}>
          <label className={getClassName("label")} htmlFor="cf-message">
            Message
            <span className={getClassName("required")}>*</span>
          </label>
          <textarea
            id="cf-message"
            name="message"
            required
            className={getClassName("textarea")}
          />
        </div>

        {enableCaptcha && (
          <div className={getClassName("captchaNote")}>
            🛡️ Protected by CAPTCHA — verification runs on submit.
          </div>
        )}

        <button
          type="submit"
          className={`${getClassName("submit")} ${
            submitWidth === "full" ? getClassName("submit--full") : ""
          }`.trim()}
        >
          {submitLabelText}
        </button>
      </form>
    </div>
  );
}

const ContactFormInner: ComponentConfig<ContactFormProps> = {
  label: "نموذج اتصال",

  fields: {
    title: bilingualTextField({
      label: "Heading",
      placeholderAr: "تواصل معنا",
      placeholderEn: "Get in touch",
    }),
    subtitle: bilingualTextField({
      label: "Subheading",
      mode: "textarea",
      placeholderAr: "سنرد خلال يوم عمل واحد.",
      placeholderEn: "We'll reply within one business day.",
    }),
    language: {
      type: "radio",
      label: "لغة العرض",
      options: [
        { label: "Arabic", value: "ar" },
        { label: "English", value: "en" },
      ],
    },
    showPhone: {
      type: "radio",
      label: "حقل الهاتف",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
    requirePhone: {
      type: "radio",
      label: "إلزام الهاتف",
      options: [
        { label: "Required", value: true },
        { label: "Optional", value: false },
      ],
    },
    showSubject: {
      type: "radio",
      label: "حقل الموضوع",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
    submitLabel: bilingualTextField({ label: "نص زر الإرسال" }),
    successMessage: bilingualTextField({ label: "رسالة النجاح" }),
    enableCaptcha: {
      type: "radio",
      label: "كابتشا",
      options: [
        { label: "Enabled", value: true },
        { label: "Disabled", value: false },
      ],
    },
    submitWidth: {
      type: "radio",
      label: "عرض زر الإرسال",
      options: [
        { label: "Auto", value: "auto" },
        { label: "Full width", value: "full" },
      ],
    },
  },

  defaultProps: {
    title: { ar: "تواصل معنا", en: "Get in touch" },
    subtitle: {
      ar: "سنرد خلال يوم عمل واحد.",
      en: "We'll reply within one business day.",
    },
    language: "ar",
    showPhone: true,
    requirePhone: false,
    showSubject: true,
    submitLabel: { ar: "إرسال", en: "Send" },
    successMessage: {
      ar: "شكراً — تم إرسال رسالتك.",
      en: "Thanks — your message was sent.",
    },
    enableCaptcha: true,
    submitWidth: "auto",
  },

  render: ContactFormRender,
};

export const ContactForm = withLayout(ContactFormInner);
