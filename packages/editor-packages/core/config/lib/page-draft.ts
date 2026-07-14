import { componentKey } from "../component-key";
import type { EditorMode } from "./editor-mode";
import { getActiveEditorMode } from "./editor-mode";
import type { UserData } from "../types";

/**
 * Crash-safe draft autosave for the editor. While editing, the current page's
 * Puck data is debounce-written under a draft key separate from the published
 * site (`puck-demo:<componentKey>:site`), so a dev-server crash or an
 * accidental tab close never loses work — while publish stays an explicit
 * action. Drafts are cleared whenever the page is actually saved.
 */

export type PageDraft = {
  savedAt: number;
  data: UserData;
};

const isBrowser = typeof window !== "undefined";

export const getDraftStorageKey = (path: string, mode?: EditorMode) => {
  const resolvedMode = mode ?? getActiveEditorMode();
  return resolvedMode === "mobile"
    ? `puck-demo:${componentKey}:draft:mobile:${path}`
    : `puck-demo:${componentKey}:draft:${path}`;
};

export function readPageDraft(path: string, mode?: EditorMode): PageDraft | null {
  if (!isBrowser) return null;

  try {
    const raw = window.localStorage.getItem(getDraftStorageKey(path, mode));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PageDraft;
    if (!parsed || typeof parsed.savedAt !== "number" || !parsed.data) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writePageDraft(
  path: string,
  data: UserData,
  mode?: EditorMode
): void {
  if (!isBrowser) return;

  try {
    window.localStorage.setItem(
      getDraftStorageKey(path, mode),
      JSON.stringify({ savedAt: Date.now(), data } satisfies PageDraft)
    );
  } catch {
    // Quota exceeded / private mode — losing the draft beats crashing the editor.
  }
}

export function clearPageDraft(path: string, mode?: EditorMode): void {
  if (!isBrowser) return;

  try {
    window.localStorage.removeItem(getDraftStorageKey(path, mode));
  } catch {
    // ignore
  }
}
