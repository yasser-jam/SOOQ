import { componentKey } from "../component-key";
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

export const getDraftStorageKey = (path: string) =>
  `puck-demo:${componentKey}:draft:${path}`;

export function readPageDraft(path: string): PageDraft | null {
  if (!isBrowser) return null;

  try {
    const raw = window.localStorage.getItem(getDraftStorageKey(path));
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

export function writePageDraft(path: string, data: UserData): void {
  if (!isBrowser) return;

  try {
    window.localStorage.setItem(
      getDraftStorageKey(path),
      JSON.stringify({ savedAt: Date.now(), data } satisfies PageDraft)
    );
  } catch {
    // Quota exceeded / private mode — losing the draft beats crashing the editor.
  }
}

export function clearPageDraft(path: string): void {
  if (!isBrowser) return;

  try {
    window.localStorage.removeItem(getDraftStorageKey(path));
  } catch {
    // ignore
  }
}
