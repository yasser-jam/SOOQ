"use client";

import { useCallback, useEffect, useState } from "react";

import {
  applyStoreTheme,
  readSelectedTheme,
  STORE_THEME_SELECTED_EVENT,
  type SelectedThemeMeta,
} from "./store-theme";

export function useSelectedStoreTheme() {
  const [selectedTheme, setSelectedTheme] = useState<SelectedThemeMeta | null>(
    null,
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSelectedTheme(readSelectedTheme());
    setIsReady(true);

    const handleThemeSelected = (event: Event) => {
      const detail = (event as CustomEvent<SelectedThemeMeta>).detail;
      setSelectedTheme(detail ?? readSelectedTheme());
    };

    window.addEventListener(STORE_THEME_SELECTED_EVENT, handleThemeSelected);
    return () => {
      window.removeEventListener(STORE_THEME_SELECTED_EVENT, handleThemeSelected);
    };
  }, []);

  const selectTheme = useCallback((themeId: number) => {
    const meta = applyStoreTheme(themeId);
    if (meta) {
      setSelectedTheme(meta);
    }
    return meta;
  }, []);

  return { selectedTheme, selectTheme, isReady };
}
