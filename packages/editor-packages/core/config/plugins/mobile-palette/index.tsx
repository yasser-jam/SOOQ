"use client";

import React, { useEffect } from "react";
import { useAppStoreApi } from "@/core/store";
import {
  getActiveEditorMode,
  isMobileEditorMode,
  type EditorMode,
} from "../../lib/editor-mode";
import { findSitePage, readSiteData } from "../../lib/site-data";
import { useSelectedPage } from "../../lib/use-selected-page";

const MOBILE_SHELL_CATEGORY = "mobileShell";

/**
 * Shows the AppBar (+ Sidebar) palette category only in the mobile editor.
 * On desktop the category stays hidden so those blocks never appear in the list.
 *
 * Full-screen pages (splash/onboarding) render outside the app shell, so the
 * category is hidden there too — `applyPuckSave` discards any shell block
 * dropped onto such a page.
 */
export function MobilePaletteSync({
  editorMode,
}: {
  editorMode?: EditorMode;
}) {
  const appStoreApi = useAppStoreApi();
  const mode = editorMode ?? getActiveEditorMode();
  const selectedPagePath = useSelectedPage();
  const isFullScreenPage =
    isMobileEditorMode(mode) &&
    findSitePage(readSiteData(mode), selectedPagePath)?.fullScreen === true;
  const isMobile = isMobileEditorMode(mode) && !isFullScreenPage;

  useEffect(() => {
    const { state, dispatch } = appStoreApi.getState();
    const list = state.ui.componentList;
    if (!list) return;

    const category = list[MOBILE_SHELL_CATEGORY];
    if (!category) return;

    if (category.visible === isMobile) return;

    dispatch({
      type: "setUi",
      ui: {
        componentList: {
          ...list,
          [MOBILE_SHELL_CATEGORY]: {
            ...category,
            visible: isMobile,
            expanded: isMobile ? true : category.expanded,
          },
        },
      },
    });
  }, [appStoreApi, isMobile]);

  return null;
}
