"use client";

import { useActiveLanguage, type ActiveLanguage } from "./LanguageContext";

/**
 * Language used for storefront/editor display resolution.
 *
 * Prefers the live LanguageProvider (toggle / cookie) over a frozen block
 * prop from Site JSON — those props stay at the theme default (`ar`) and
 * would otherwise ignore "تبديل اللغة".
 */
export function useDisplayLanguage(
  fallback: ActiveLanguage = "ar"
): ActiveLanguage {
  const ctx = useActiveLanguage();
  if (ctx.__provided) return ctx.language;
  return fallback === "en" ? "en" : "ar";
}
