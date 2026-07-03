"use client";
import React, { useEffect } from "react";
import { useAppStore, useAppStoreApi } from "@/core/store";

/** Content palette without HTML block (matches `config.categories.content.components`). */
export const CONTENT_PALETTE_BASE = [
  "ContentHeading",
  "ContentParagraph",
  "ContentImage",
  "ContentButton",
  "ContentDivider",
  "Space",
  "ImageGallery",
  "VideoEmbed",
  "ContentIcon",
  "Group",
] as const;

/** Inserts `ContentHtml` after paragraph when enabled in Settings. */
export const CONTENT_PALETTE_WITH_HTML = [
  "ContentHeading",
  "ContentParagraph",
  "ContentHtml",
  "ContentImage",
  "ContentButton",
  "ContentDivider",
  "Space",
  "ImageGallery",
  "VideoEmbed",
  "ContentIcon",
  "Group",
] as const;

function listsEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Keeps the Content palette in sync with Settings → Editor → HTML block toggle. */
export function HtmlBlockPaletteSync() {
  const enable = useAppStore(
    (s) =>
      (s.state.data.root.props as { enableHtmlRichTextBlock?: boolean })
        ?.enableHtmlRichTextBlock === true
  );
  const appStoreApi = useAppStoreApi();

  useEffect(() => {
    const { state, dispatch } = appStoreApi.getState();
    const content = state.ui.componentList?.content;
    if (!content?.components) return;

    const next = enable
      ? [...CONTENT_PALETTE_WITH_HTML]
      : [...CONTENT_PALETTE_BASE];

    if (listsEqual(content.components as string[], next)) {
      return;
    }

    dispatch({
      type: "setUi",
      ui: {
        componentList: {
          ...state.ui.componentList,
          content: {
            ...content,
            components: next,
          },
        },
      },
    });
  }, [enable, appStoreApi]);

  return null;
}
