export type BilingualString = {
  ar: string;
  en: string;
};

export const EMPTY_BILINGUAL: BilingualString = { ar: "", en: "" };

/** True when value looks like a serializable `{ ar, en }` bilingual string. */
export function isBilingualValue(value: unknown): value is BilingualString {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  // React elements from contentEditable field transforms have $$typeof —
  // never treat those as bilingual props.
  if ("$$typeof" in value) return false;
  return "ar" in value || "en" in value;
}

/** Coerce legacy string or partial object into a full BilingualString. */
export function normalizeBilingual(
  value: BilingualString | string | undefined | null
): BilingualString {
  if (typeof value === "string") return { ar: value, en: "" };
  if (value && typeof value === "object") {
    return {
      ar: typeof value.ar === "string" ? value.ar : "",
      en: typeof value.en === "string" ? value.en : "",
    };
  }
  return { ...EMPTY_BILINGUAL };
}

/**
 * Resolve a bilingual string against the active language, with a sensible
 * fallback chain: requested → other → empty string.
 *
 * Also passes through non-bilingual values unchanged. That matters in the
 * editor: contentEditable field transforms replace props with React elements
 * (e.g. `BilingualInlineTextField`) before the block render runs. Calling
 * pickLang on those elements must not collapse them to "".
 */
export function pickLang(
  value: BilingualString | string | undefined | unknown,
  language: "ar" | "en" = "ar"
): any {
  if (value == null || value === false) return "";
  if (typeof value === "string") return value;
  if (!isBilingualValue(value)) return value;
  const primary = value[language];
  if (primary) return primary;
  return value[language === "ar" ? "en" : "ar"] ?? "";
}
