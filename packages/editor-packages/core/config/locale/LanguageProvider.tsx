"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActiveLanguage,
  defaultDirection,
  LanguageContext,
  type LanguageContextValue,
} from "./LanguageContext";

export const SOOQ_LANG_COOKIE = "sooq_lang";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
  );
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function normalizeLanguage(value: unknown): ActiveLanguage {
  return value === "en" ? "en" : "ar";
}

export function LanguageProvider({
  children,
  initialLanguage = "ar",
  persist = false,
}: {
  children: React.ReactNode;
  initialLanguage?: ActiveLanguage;
  persist?: boolean;
}) {
  const [language, setLanguageState] = useState<ActiveLanguage>(() => {
    if (persist) {
      const fromCookie = readCookie(SOOQ_LANG_COOKIE);
      if (fromCookie === "ar" || fromCookie === "en") return fromCookie;
    }
    return normalizeLanguage(initialLanguage);
  });

  const direction = defaultDirection(language);

  const setLanguage = useCallback(
    (next: ActiveLanguage) => {
      setLanguageState(next);
      if (persist) writeCookie(SOOQ_LANG_COOKIE, next);
    },
    [persist]
  );

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "ar" ? "en" : "ar");
  }, [language, setLanguage]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      direction,
      setLanguage,
      toggleLanguage,
      __provided: true,
    }),
    [language, direction, setLanguage, toggleLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}
