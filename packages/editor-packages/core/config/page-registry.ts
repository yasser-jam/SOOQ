// ─── Page registry ────────────────────────────────────────────────────────────
// Static catalog of built-in pages. Runtime pages live in SiteData.pages.

export type PageDefinition = {
  /** URL path, e.g. "/" or "/cart" */
  path: string;
  /** Human-readable name shown in the pages panel */
  label: string;
  /** Short description shown below the label */
  description: string;
  /** Lucide icon name (used by the plugin UI) */
  iconName: "Home" | "ShoppingCart" | "Package" | "Palette" | "FileText";
  /** true when the path contains a dynamic segment (e.g. :product-slug). */
  dynamic?: boolean;
  /** Concrete path used for editing when dynamic = true */
  examplePath?: string;
  /** Whether this page was created by the merchant at runtime. */
  isCustom?: boolean;
  /** Mobile bottom-tab icon (engine allow-list, see `mobile-tab-icons.ts`). Mobile editor only. */
  tabIcon?: string;
  /** Whether this page appears in the mobile bottom tab bar. Defaults to true when unset. */
  showInTabs?: boolean;
};

export const PAGES_UPDATED_EVENT = "puck-demo-pages-updated";

export const isValidIconName = (
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

export const dedupeByPath = (pages: PageDefinition[]) => {
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

  if (value === "/edit" || value.endsWith("/edit")) {
    return null;
  }

  // Dynamic segments (":param") are allowed; each dynamic segment must be a
  // non-empty parameter name (e.g. "/products/:product-slug"). Reject stray
  // colons like "/foo/:" or "/foo/:/bar".
  const segments = value.split("/").filter(Boolean);
  for (const segment of segments) {
    if (segment === ":" || segment.startsWith("::")) return null;
  }

  return value || null;
};

/** True when the path contains at least one dynamic ":param" segment. */
export function isDynamicPath(path: string): boolean {
  return path
    .split("/")
    .filter(Boolean)
    .some((segment) => segment.startsWith(":") && segment.length > 1);
}

/**
 * Auto-generate a concrete example path for a dynamic pattern by replacing
 * each ":param" segment with "example-<param>" (e.g. "/products/:product-slug"
 * → "/products/example-product-slug"). Used as the default `examplePath` when
 * merchants create a dynamic page.
 */
export function buildExamplePathFromPattern(pattern: string): string {
  const segments = pattern.split("/").map((segment) => {
    if (segment.startsWith(":") && segment.length > 1) {
      return `example-${segment.slice(1)}`;
    }
    return segment;
  });
  return segments.join("/");
}

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
  {
    path: "/checkout",
    label: "Checkout",
    description: "Address, payment method, discount and order confirmation",
    iconName: "ShoppingCart",
  },
  {
    path: "/login",
    label: "Login",
    description: "Customer login",
    iconName: "FileText",
  },
  {
    path: "/verify-otp",
    label: "Verify OTP",
    description: "OTP verification",
    iconName: "FileText",
  },
  {
    path: "/pricing",
    label: "Pricing",
    description: "Pricing plans",
    iconName: "FileText",
  },
  {
    path: "/about",
    label: "About Us",
    description: "About the store",
    iconName: "FileText",
  },
  {
    path: "/settings",
    label: "Account Settings",
    description:
      "Customer profile, marketing preferences and saved addresses",
    iconName: "FileText",
  },
  {
    path: "/orders",
    label: "Orders",
    description: "Customer order history",
    iconName: "Package",
  },
  {
    path: "/orders/:order-id",
    label: "Order Details",
    description: "Individual order page",
    iconName: "Package",
    dynamic: true,
    examplePath: "/orders/example-order",
  },
];

/** Returns the path used for the editor URL (substitutes dynamic segments) */
export function getEditPath(page: Pick<PageDefinition, "path" | "examplePath">) {
  return page.examplePath ?? page.path;
}

/** Derives the current page from a design-studio pathname or legacy `/path/edit`. */
export function matchCurrentPage(
  pathname: string,
  pages: PageDefinition[] = PAGES
): PageDefinition | undefined {
  const studioMatch = pathname.match(
    /^(\/store\/[^/]+\/design-studio)(?:\/(.*))?$/
  );

  if (studioMatch) {
    const suffix = (studioMatch[2] ?? "").replace(/\/(edit|preview)$/, "");
    const current =
      !suffix || suffix === "home" ? "/" : `/${suffix.replace(/^\/+/, "")}`;

    return pages.find((p) => getEditPath(p) === current);
  }

  const current = pathname.replace(/\/edit$/, "") || "/";
  return pages.find((p) => getEditPath(p) === current);
}
