export const SELECTED_PAGE_EVENT = "puck-demo-selected-page";

// In-memory only: the currently selected page must not survive a reload or a
// fresh editor mount. Every time the editor is (re)opened it should start on
// the home page ("/"), regardless of what page was last edited.
let selectedPage: string | null = null;

export function readSelectedPage(): string | null {
  return selectedPage;
}

function writeSelectedPage(path: string) {
  selectedPage = path;
}

// Call when the editor is (re)entered so a fresh mount never inherits the
// page selected during a previous editing session.
export function resetSelectedPage() {
  selectedPage = null;
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
