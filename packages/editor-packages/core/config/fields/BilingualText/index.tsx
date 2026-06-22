/**
 * BilingualText field — SOOQ.
 *
 * A reusable Puck `custom` field that captures a string in **both Arabic and
 * English** in one panel row. Stores `{ ar: string; en: string }` as plain
 * JSON (DSN-016 / OTA contract — no functions, fully serializable).
 *
 * Usage:
 *
 *   import { bilingualTextField, type BilingualString, pickLang } from
 *     "../../fields/BilingualText";
 *
 *   fields: {
 *     title: bilingualTextField({ label: "Title" }),
 *   }
 *
 *   defaultProps: { title: { ar: "العنوان", en: "Title" } }
 *
 *   render: ({ title }) => <h2>{pickLang(title, language)}</h2>
 */
import React from "react";
import { CustomField } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("BilingualText", styles);

export type BilingualString = {
  ar: string;
  en: string;
};

export const EMPTY_BILINGUAL: BilingualString = { ar: "", en: "" };

/**
 * Resolve a bilingual string against the active language, with a sensible
 * fallback chain: requested → other → empty string.
 */
export function pickLang(
  value: BilingualString | string | undefined,
  language: "ar" | "en" = "ar"
): string {
  if (!value) return "";
  if (typeof value === "string") return value; // legacy single-language string
  const primary = value[language];
  if (primary) return primary;
  return value[language === "ar" ? "en" : "ar"] ?? "";
}

type Mode = "input" | "textarea";

type FieldOptions = {
  label?: string;
  mode?: Mode;
  placeholderAr?: string;
  placeholderEn?: string;
};

function BilingualTextRender({
  value,
  onChange,
  field,
  mode,
}: {
  value: BilingualString | string | undefined;
  onChange: (next: BilingualString) => void;
  field: { label?: string; placeholderAr?: string; placeholderEn?: string };
  mode: Mode;
}) {
  // Coerce legacy string values into the bilingual shape so this field can
  // upgrade-in-place without a separate migration.
  const normalized: BilingualString =
    typeof value === "string"
      ? { ar: value, en: value }
      : value ?? EMPTY_BILINGUAL;

  const update = (lang: "ar" | "en", v: string) =>
    onChange({ ...normalized, [lang]: v });

  return (
    <div className={getClassName()}>
      {/* Arabic row first — SOOQ is Arabic-first (DSN-001) */}
      <div className={getClassName("row")}>
        <label className={getClassName("label")}>
          {field.label ?? "Text"}
          <span className={getClassName("langTag")}>AR</span>
        </label>
        {mode === "textarea" ? (
          <textarea
            className={`${getClassName("textarea")} ${getClassName("textarea--ar")}`}
            value={normalized.ar}
            placeholder={field.placeholderAr}
            onChange={(e) => update("ar", e.target.value)}
            dir="rtl"
            lang="ar"
          />
        ) : (
          <input
            type="text"
            className={`${getClassName("input")} ${getClassName("input--ar")}`}
            value={normalized.ar}
            placeholder={field.placeholderAr}
            onChange={(e) => update("ar", e.target.value)}
            dir="rtl"
            lang="ar"
          />
        )}
      </div>

      <div className={getClassName("row")}>
        <label className={getClassName("label")}>
          {field.label ?? "Text"}
          <span className={getClassName("langTag")}>EN</span>
        </label>
        {mode === "textarea" ? (
          <textarea
            className={getClassName("textarea")}
            value={normalized.en}
            placeholder={field.placeholderEn}
            onChange={(e) => update("en", e.target.value)}
            dir="ltr"
            lang="en"
          />
        ) : (
          <input
            type="text"
            className={getClassName("input")}
            value={normalized.en}
            placeholder={field.placeholderEn}
            onChange={(e) => update("en", e.target.value)}
            dir="ltr"
            lang="en"
          />
        )}
      </div>
    </div>
  );
}

export function bilingualTextField(
  opts: FieldOptions = {}
): CustomField<BilingualString> {
  const { label = "Text", mode = "input", placeholderAr, placeholderEn } = opts;
  return {
    type: "custom",
    label,
    render: ({ value, onChange }) => (
      <BilingualTextRender
        value={value as BilingualString | string | undefined}
        onChange={onChange}
        field={{ label, placeholderAr, placeholderEn }}
        mode={mode}
      />
    ),
  };
}
