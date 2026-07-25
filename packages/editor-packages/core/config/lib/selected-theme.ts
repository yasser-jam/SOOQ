import { componentKey } from "../index";

/**
 * UI-only cache of which design the merchant is editing. It exists so the
 * design-studio URL segment (`/design-studio/<theme>/edit`) survives a reload
 * without an extra round trip; the design itself lives on the DSN backend.
 *
 * Written by the app after a draft loads or a template is applied. Nothing
 * outside URL building may treat this as authoritative.
 */
export type SelectedThemeMeta = {
  templateKey: string;
  name: string;
  previewImageUrl?: string | null;
};

/** Segment used when no design has been resolved yet. */
export const FALLBACK_THEME_NAME = "Theme 1";

export const SELECTED_THEME_CHANGED_EVENT = "selected-theme-changed";

const SELECTED_THEME_KEY = `puck-demo:${componentKey}:selected-theme`;

const isBrowser =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function readSelectedTheme(): SelectedThemeMeta | null {
  if (!isBrowser) return null;

  const raw = window.localStorage.getItem(SELECTED_THEME_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SelectedThemeMeta>;
    if (!parsed || typeof parsed.name !== "string" || !parsed.name) return null;

    return {
      templateKey:
        typeof parsed.templateKey === "string" ? parsed.templateKey : "",
      name: parsed.name,
      previewImageUrl: parsed.previewImageUrl ?? null,
    };
  } catch {
    return null;
  }
}

export function writeSelectedTheme(meta: SelectedThemeMeta): void {
  if (!isBrowser) return;

  const current = readSelectedTheme();
  if (
    current &&
    current.templateKey === meta.templateKey &&
    current.name === meta.name &&
    (current.previewImageUrl ?? null) === (meta.previewImageUrl ?? null)
  ) {
    return;
  }

  window.localStorage.setItem(SELECTED_THEME_KEY, JSON.stringify(meta));
  window.dispatchEvent(
    new CustomEvent(SELECTED_THEME_CHANGED_EVENT, { detail: meta })
  );
}

export function clearSelectedTheme(): void {
  if (!isBrowser) return;

  window.localStorage.removeItem(SELECTED_THEME_KEY);
  window.dispatchEvent(
    new CustomEvent(SELECTED_THEME_CHANGED_EVENT, { detail: null })
  );
}
