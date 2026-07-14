import {
  findSitePage,
  normalizeSiteData,
  readSiteData,
  seedMobileSiteFromDesktop,
  writeSiteData,
  type SiteData,
} from "./site-data";

/**
 * Copy the current page's content from the desktop site into the mobile site.
 * Other pages and zones on mobile are left unchanged.
 */
export function syncMobilePageFromDesktop(editPath: string): SiteData {
  const desktop = readSiteData("desktop");
  const mobile = readSiteData("mobile");
  const desktopPage = findSitePage(desktop, editPath);

  if (!desktopPage) {
    return mobile;
  }

  const matched = findSitePage(mobile, editPath);
  const pageIndex = matched
    ? mobile.pages.findIndex((page) => page.path === matched.path)
    : -1;

  const syncedContent = JSON.parse(
    JSON.stringify(desktopPage.content ?? [])
  ) as SiteData["pages"][number]["content"];

  const syncedPage = {
    ...(pageIndex >= 0 ? mobile.pages[pageIndex]! : desktopPage),
    title: desktopPage.title ?? desktopPage.name,
    content: syncedContent,
  };

  const pages =
    pageIndex >= 0
      ? mobile.pages.map((page, index) =>
          index === pageIndex ? { ...page, ...syncedPage } : page
        )
      : [...mobile.pages, syncedPage];

  const next = normalizeSiteData({ ...mobile, pages });
  writeSiteData(next, "mobile");
  return next;
}

/**
 * Copy global theme / root props from desktop into the mobile site.
 * Pages and zones on mobile are preserved.
 */
export function syncMobileThemeFromDesktop(): SiteData {
  const desktop = readSiteData("desktop");
  const mobile = readSiteData("mobile");

  const next = normalizeSiteData({
    ...mobile,
    root: {
      ...(mobile.root ?? { props: {} }),
      props: {
        ...((desktop.root?.props ?? {}) as Record<string, unknown>),
      },
    },
  });

  writeSiteData(next, "mobile");
  return next;
}

/** Replace the entire mobile site with a fresh copy of desktop. */
export function resetMobileSiteFromDesktop(): SiteData {
  return seedMobileSiteFromDesktop();
}
