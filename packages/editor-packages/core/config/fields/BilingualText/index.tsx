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
import {
  EMPTY_BILINGUAL,
  isBilingualValue,
  normalizeBilingual,
  pickLang,
  type BilingualString,
} from "@/core/lib/bilingual";
import styles from "./styles.module.css";

export type { BilingualString } from "@/core/lib/bilingual";
export { EMPTY_BILINGUAL, isBilingualValue, normalizeBilingual, pickLang };

const getClassName = getClassNameFactory("BilingualText", styles);

type Mode = "input" | "textarea";

type FieldOptions = {
  label?: string;
  mode?: Mode;
  placeholderAr?: string;
  placeholderEn?: string;
  contentEditable?: boolean;
};

type BilingualTextRenderProps = {
  value: BilingualString | string | undefined;
  onChange: (next: BilingualString) => void;
  field: {
    label?: string;
    placeholderAr?: string;
    placeholderEn?: string;
  };
  mode: Mode;
  Label: React.FC<{
    label?: string;
    readOnly?: boolean;
    children?: React.ReactNode;
  }>;
  readOnly?: boolean;
};

function BilingualTextRender({
  value,
  onChange,
  field,
  mode,
  Label,
  readOnly,
}: BilingualTextRenderProps) {
  const normalized = normalizeBilingual(value);

  const update = (lang: "ar" | "en", v: string) =>
    onChange({ ...normalized, [lang]: v });

  return (
    <div className={getClassName()}>
      {/* Arabic row first — SOOQ is Arabic-first (DSN-001) */}
      <div className={getClassName("row")}>
        <Label label={field.label} readOnly={readOnly}>
          <span className={getClassName("langTag")}>AR</span>
          {mode === "textarea" ? (
            <textarea
              className={`${getClassName("textarea")} ${getClassName("textarea--ar")}`}
              value={normalized.ar}
              placeholder={field.placeholderAr}
              onChange={(e) => update("ar", e.target.value)}
              dir="rtl"
              lang="ar"
              disabled={readOnly}
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
              disabled={readOnly}
            />
          )}
        </Label>
      </div>

      <div className={getClassName("row")}>
        <Label label={field.label} readOnly={readOnly}>
          <span className={getClassName("langTag")}>EN</span>
          {mode === "textarea" ? (
            <textarea
              className={getClassName("textarea")}
              value={normalized.en}
              placeholder={field.placeholderEn}
              onChange={(e) => update("en", e.target.value)}
              dir="ltr"
              lang="en"
              disabled={readOnly}
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
              disabled={readOnly}
            />
          )}
        </Label>
      </div>
    </div>
  );
}

export function bilingualTextField(
  opts: FieldOptions = {}
): CustomField<BilingualString> {
  const {
    label = "Text",
    mode = "input",
    placeholderAr,
    placeholderEn,
    contentEditable,
  } = opts;
  return {
    type: "custom",
    label,
    contentEditable,
    metadata: { group: "content" },
    // AutoField passes Label/readOnly at runtime; upstream CustomFieldRender omits them.
    render: (props: any) => {
      const { value, onChange, Label, readOnly } = props;
      return (
        <BilingualTextRender
          value={value as BilingualString | string | undefined}
          onChange={onChange}
          field={{ label, placeholderAr, placeholderEn }}
          mode={mode}
          Label={Label}
          readOnly={readOnly}
        />
      );
    },
  };
}
