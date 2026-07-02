/** Maps an editor page path (e.g. `/cart`) to a design-studio URL segment. */
export function pagePathToStudioSegment(pagePath: string): string {
  const normalized = pagePath === "" ? "/" : pagePath;
  if (normalized === "/") return "home";
  return normalized.replace(/^\//, "");
}

export function buildStudioEditHref(
  studioBase: string,
  pagePath: string
): string {
  return `${studioBase}/${pagePathToStudioSegment(pagePath)}/edit`;
}

export function getStudioBaseFromPathname(pathname: string): string | null {
  const match = pathname.match(/^(\/store\/[^/]+\/design-studio)(?:\/|$)/);
  return match?.[1] ?? null;
}

/** Parses `/store/:slug/design-studio/:segments/edit` into studio base + page path. */
export function parseStudioPathname(pathname: string): {
  studioBase: string;
  pagePath: string;
} | null {
  const studioBase = getStudioBaseFromPathname(pathname);
  if (!studioBase) return null;

  const suffix = pathname.slice(studioBase.length).replace(/^\//, "");
  const segmentPath = suffix.replace(/\/(edit|preview)$/, "");

  if (!segmentPath || segmentPath === "home") {
    return { studioBase, pagePath: "/" };
  }

  return { studioBase, pagePath: `/${segmentPath}` };
}
