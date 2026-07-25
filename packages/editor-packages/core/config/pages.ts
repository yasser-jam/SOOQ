// Re-export page registry for backward compatibility.
export {
  PAGES,
  PAGES_UPDATED_EVENT,
  buildExamplePathFromPattern,
  dedupeByPath,
  getEditPath,
  isDynamicPath,
  isValidIconName,
  matchCurrentPage,
  normalizePagePath,
  type PageDefinition,
} from "./page-registry";

export { CUSTOM_PAGES_STORAGE_KEY } from "./lib/site-data";

import {
  PAGES,
  PAGES_UPDATED_EVENT,
  dedupeByPath,
  getEditPath,
  isValidIconName,
  normalizePagePath,
  type PageDefinition,
} from "./page-registry";
import {
  addSitePage,
  readSiteData,
  sitePageToDefinition,
  writeSiteData,
} from "./lib/site-data";

const isBrowser =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function readCustomPages(): PageDefinition[] {
  if (!isBrowser) return [];

  const site = readSiteData();
  return site.pages
    .filter((page) => page.isCustom)
    .map((page) => sitePageToDefinition(page));
}

export function writeCustomPages(pages: PageDefinition[]) {
  if (!isBrowser) return;

  const builtInPaths = new Set(PAGES.map((page) => page.path));
  let site = readSiteData();

  site = {
    ...site,
    pages: site.pages.filter((page) => !page.isCustom),
  };

  dedupeByPath(
    pages.map((page) => ({
      ...page,
      path: normalizePagePath(page.path) ?? page.path,
      dynamic: false,
      isCustom: true,
      iconName: isValidIconName(page.iconName) ? page.iconName : "FileText",
    }))
  )
    .filter((page) => !builtInPaths.has(page.path))
    .forEach((page) => {
      site = addSitePage(site, {
        path: page.path,
        name: page.label,
        link: getEditPath(page),
        description: page.description,
        iconName: page.iconName,
        isCustom: true,
      });
    });

  writeSiteData(site);
}

export function getAllPages(): PageDefinition[] {
  if (!isBrowser) return PAGES;

  const site = readSiteData();
  if (site.pages.length === 0) return PAGES;

  return site.pages.map((page) => sitePageToDefinition(page));
}
