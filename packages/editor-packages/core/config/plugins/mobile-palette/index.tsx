"use client";

import React, { useEffect } from "react";
import { useAppStoreApi } from "@/core/store";
import {
  getActiveEditorMode,
  isMobileEditorMode,
  type EditorMode,
} from "../../lib/editor-mode";

const MOBILE_SHELL_CATEGORY = "mobileShell";

/**
 * Shows the AppBar (+ Sidebar) palette category only in the mobile editor.
 * On desktop the category stays hidden so those blocks never appear in the list.
 */
export function MobilePaletteSync({
  editorMode,
}: {
  editorMode?: EditorMode;
}) {
  const appStoreApi = useAppStoreApi();
  const mode = editorMode ?? getActiveEditorMode();
  const isMobile = isMobileEditorMode(mode);

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
