import React from "react";
import type { Plugin } from "@/core";
import { CanvasInteractions } from "./CanvasContextMenu";

/**
 * Canvas interactions plugin.
 *
 * Provides merchant-facing editing affordances that target the canvas directly:
 *   - Right-click context menu on any block (Copy / Paste / Duplicate /
 *     Move up|down / Hide|Show / Delete).
 *   - Global keyboard shortcuts for the same operations (Cmd/Ctrl+D, +C, +V,
 *     +↑/↓, H, Delete).
 *   - Auto-selects the right-clicked block so the right panel is always in sync.
 *
 * Every action goes through the Puck reducer — the clipboard is the only
 * ephemeral piece of state and is explicitly kept out of `store_config.json`.
 *
 * Mounts via `overrides.puck` so the single component wraps the whole editor
 * once and can listen to both the outer document and the preview iframe's
 * document without racing the iframe's load.
 */
export const canvasInteractionsPlugin: Plugin = {
  name: "canvas-interactions",
  overrides: {
    puck: ({ children }) => <CanvasInteractions>{children}</CanvasInteractions>,
  },
};

export { CanvasInteractions };
