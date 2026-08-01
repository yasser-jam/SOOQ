"use client";

import { createContext, useContext } from "react";

export type ActiveLanguage = "ar" | "en";
export type ActiveDirection = "rtl" | "ltr";

export type LanguageContextValue = {
  language: ActiveLanguage;
  direction: ActiveDirection;
  setLanguage: (lang: ActiveLanguage) => void;
  toggleLanguage: () => void;
  /** False when no LanguageProvider is mounted above — used by RootLocaleGate. */
  __provided: boolean;
};

const defaultDirection = (language: ActiveLanguage): ActiveDirection =>
  language === "ar" ? "rtl" : "ltr";

export const LanguageContext = createContext<LanguageContextValue>({
  language: "ar",
  direction: "rtl",
  setLanguage: () => {},
  toggleLanguage: () => {},
  __provided: false,
});

export function useActiveLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

export { defaultDirection };
