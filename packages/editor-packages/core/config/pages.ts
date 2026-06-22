// ─── Page registry ────────────────────────────────────────────────────────────
// Single source of truth for all pages in the site.
// The Pages plugin reads this list; initial-data.ts provides the starter JSON
// for each path.

export type PageDefinition = {
  /** URL path, e.g. "/" or "/cart" */
  path: string;
  /** Human-readable name shown in the pages panel */
  label: string;
  /** Short description shown below the label */
  description: string;
  /** Lucide icon name (used by the plugin UI) */
  iconName: "Home" | "ShoppingCart" | "Package" | "Palette" | "FileText";
  /**
   * true = the path contains a dynamic segment (e.g. :product-slug).
   * The editor will load a representative example URL (examplePath).
   */
  dynamic?: boolean;
  /** The concrete path used for editing when dynamic = true */
  examplePath?: string;
  /** Whether this page was created by the merchant at runtime. */
  isCustom?: boolean;
};

export const CUSTOM_PAGES_STORAGE_KEY = "puck-demo-custom-pages:v1";
export const PAGES_UPDATED_EVENT = "puck-demo-pages-updated";

const isBrowser =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const isValidIconName = (
  iconName: unknown
): iconName is PageDefinition["iconName"] => {
  return (
    iconName === "Home" ||
    iconName === "ShoppingCart" ||
    iconName === "Package" ||
    iconName === "Palette" ||
    iconName === "FileText"
  );
};

const dedupeByPath = (pages: PageDefinition[]) => {
  const seen = new Set<string>();

  return pages.filter((page) => {
    if (seen.has(page.path)) return false;
    seen.add(page.path);
    return true;
  });
};

export function normalizePagePath(rawPath: string): string | null {
  let value = rawPath.trim();

  if (!value) return null;

  // If a full URL is pasted, keep only the pathname.
  try {
    const asUrl = new URL(value);
    value = asUrl.pathname;
  } catch {
    // Not a full URL; keep raw input.
  }

  value = value
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/\?.*$/, "")
    .replace(/#.*$/, "");

  if (!value.startsWith("/")) {
    value = `/${value}`;
  }

  if (value.length > 1 && value.endsWith("/")) {
    value = value.slice(0, -1);
  }

  // Keep custom pages concrete and avoid clashing with edit suffix routes.
  if (value === "/edit" || value.endsWith("/edit") || value.includes(":")) {
    return null;
  }

  return value || null;
}

const parseCustomPage = (value: unknown): PageDefinition | null => {
  if (!value || typeof value !== "object") return null;

  const raw = value as Partial<PageDefinition>;
  const path = normalizePagePath(typeof raw.path === "string" ? raw.path : "");
  const label = typeof raw.label === "string" ? raw.label.trim() : "";

  if (!path || !label) return null;

  const description =
    typeof raw.description === "string" && raw.description.trim().length > 0
      ? raw.description.trim()
      : "Custom page";

  return {
    path,
    label,
    description,
    iconName: isValidIconName(raw.iconName) ? raw.iconName : "FileText",
    dynamic: false,
    isCustom: true,
  };
};

export const PAGES: PageDefinition[] = [
  {
    path: "/",
    label: "Home",
    description: "Main landing page",
    iconName: "Home",
  },
  {
    path: "/themes",
    label: "Theme gallery",
    description: "Browse and edit theme presets",
    iconName: "Palette",
  },
  {
    path: "/products/:product-slug",
    label: "Product Details",
    description: "Individual product page",
    iconName: "Package",
    dynamic: true,
    examplePath: "/products/example-product",
  },
  {
    path: "/cart",
    label: "Cart",
    description: "Shopping cart & checkout",
    iconName: "ShoppingCart",
  },
];

/** Returns the path used for the editor URL (substitutes dynamic segments) */
export function getEditPath(page: PageDefinition): string {
  return page.examplePath ?? page.path;
}

export function readCustomPages(): PageDefinition[] {
  if (!isBrowser) return [];

  try {
    const raw = window.localStorage.getItem(CUSTOM_PAGES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return dedupeByPath(
      parsed
        .map((entry) => parseCustomPage(entry))
        .filter((entry): entry is PageDefinition => Boolean(entry))
    );
  } catch {
    return [];
  }
}

export function writeCustomPages(pages: PageDefinition[]) {
  if (!isBrowser) return;

  const next = dedupeByPath(
    pages.map((page) => ({
      ...page,
      path: normalizePagePath(page.path) ?? page.path,
      dynamic: false,
      isCustom: true,
      iconName: isValidIconName(page.iconName) ? page.iconName : "FileText",
    }))
  );

  window.localStorage.setItem(CUSTOM_PAGES_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(PAGES_UPDATED_EVENT));
}

export function getAllPages(): PageDefinition[] {
  const customPages = readCustomPages();

  if (customPages.length === 0) {
    return PAGES;
  }

  const existingEditPaths = new Set(PAGES.map((page) => getEditPath(page)));
  const nextCustomPages = customPages.filter(
    (page) => !existingEditPaths.has(getEditPath(page))
  );

  return [...PAGES, ...nextCustomPages];
}

/** Derives the current page (if any) from a browser pathname like "/cart/edit" */
export function matchCurrentPage(
  pathname: string,
  pages: PageDefinition[] = PAGES
): PageDefinition | undefined {
  // Strip trailing "/edit"
  const current = pathname.replace(/\/edit$/, "") || "/";
  return pages.find(
    (p) => (p.examplePath ?? p.path) === current
  );
}
