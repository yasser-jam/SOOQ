export type BilingualString = {
  ar: string;
  en: string;
};

export const EMPTY_BILINGUAL: BilingualString = { ar: "", en: "" };

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
 */
export function pickLang(
  value: BilingualString | string | undefined,
  language: "ar" | "en" = "ar"
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const primary = value[language];
  if (primary) return primary;
  return value[language === "ar" ? "en" : "ar"] ?? "";
}
