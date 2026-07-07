import { componentKey } from "../index";

export const SELECTED_PAGE_EVENT = "puck-demo-selected-page";

const SELECTED_PAGE_KEY = `puck-demo:${componentKey}:selected-page`;

export function readSelectedPage(): string | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SELECTED_PAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { path?: string };
    return typeof parsed.path === "string" ? parsed.path : null;
  } catch {
    return null;
  }
}

function writeSelectedPage(path: string) {
  window.localStorage.setItem(SELECTED_PAGE_KEY, JSON.stringify({ path }));
}

export function applySelectedPage(pagePath: string) {
  if (typeof window === "undefined") return;

  writeSelectedPage(pagePath);
  window.dispatchEvent(
    new CustomEvent(SELECTED_PAGE_EVENT, { detail: { path: pagePath } })
  );
}

export function getSelectedPageOrDefault(): string {
  return readSelectedPage() ?? "/";
}
