import type { ComponentData } from "@/core/types";

/**
 * Module-level clipboard. Holds the last-copied component snapshot so
 * Ctrl/Cmd+C -> Ctrl/Cmd+V works across re-renders and (within the same
 * session) across page-selector switches. Kept out of Zustand on purpose:
 * the clipboard is ephemeral and must NOT end up in `store_config.json`.
 */
let clipboard: ComponentData | null = null;

export function readClipboard(): ComponentData | null {
  return clipboard;
}

export function hasClipboardContent(): boolean {
  return clipboard !== null;
}

export function writeClipboard(data: ComponentData): void {
  // Deep-clone so further edits to the source can't mutate the clipboard.
  // structuredClone is available in all evergreen browsers.
  clipboard =
    typeof structuredClone === "function"
      ? structuredClone(data)
      : (JSON.parse(JSON.stringify(data)) as ComponentData);
}
