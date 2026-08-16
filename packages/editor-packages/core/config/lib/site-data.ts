import { componentKey } from "../component-key";
import { initialData } from "../initial-data";
import {
  PAGES,
  PAGES_UPDATED_EVENT,
  dedupeByPath,
  getEditPath,
  isValidIconName,
  normalizePagePath,
  type PageDefinition,
} from "../page-registry";
import { normalizeEditorData } from "./normalize-editor-data";
import {
  type EditorMode,
  getActiveEditorMode,
  isMobileEditorMetadata,
} from "./editor-mode";
import {
  emptyAppBar,
  isEmptyAppBar,
  normalizeSitePageAppBar,
  toEditorAppBarNode,
  toPersistedAppBar,
  type SitePageAppBar,
} from "./app-bar";
import {
  emptySidebar,
  isEmptySidebar,
  normalizeSiteSidebar,
  sidebarFromZoneDrawer,
  toEditorSidebarNode,
  toPersistedSidebar,
  type SiteSidebar,
} from "./site-sidebar";
import type { UserData } from "../types";
import {
  isBilingualValue,
  pickLang,
  type BilingualString,
} from "../../lib/bilingual";
import { ROOT_ZONE_DRAWER } from "../shell-zones";

export type { EditorMode } from "./editor-mode";
export {
  getActiveEditorMode,
  isMobileEditorMetadata,
  isMobileEditorMode,
  parseEditorMode,
  setActiveEditorMode,
} from "./editor-mode";
export type { SitePageAppBar } from "./app-bar";
export type { SiteSidebar } from "./site-sidebar";

type JsonRecord = Record<string, unknown>;
type ZoneMap = NonNullable<UserData["zones"]>;

type ComponentLike = {
  type: string;
  props: JsonRecord;
};

/** Page meta text — plain string (legacy) or bilingual `{ ar, en }`. */
export type SitePageText = string | BilingualString;

/** Resolve page meta for a language (editor UI defaults to Arabic). */
export function resolveSitePageText(
  value: SitePageText | undefined | null,
  language: "ar" | "en" = "ar",
  fallback = ""
): string {
  if (value == null || value === "") return fallback;
  const resolved = pickLang(value, language);
  return typeof resolved === "string" && resolved ? resolved : fallback;
}

/** @deprecated Legacy custom-page registry key — migrated into SiteData.pages */
export const CUSTOM_PAGES_STORAGE_KEY = "puck-demo-custom-pages:v1";

const SHELL_COMPONENT_TYPES = new Set([
  "SiteHeader",
  "SiteFooter",
  "SiteDrawerShell",
  "ZoneDrawer",
  "ZonePopup",
  "ZoneBottomSheet",
  /** Per-page mobile chrome — extracted to `page.appBar` on save. */
  "AppBar",
]);

/** Site-level mobile sidebar — extracted to `site.sidebar` on save (mobile). */
const SIDEBAR_COMPONENT_TYPE = "Sidebar";

const isBrowser =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const isPlainObject = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

export type SitePage = {
  /** Route pattern, e.g. "/" or "/products/:product-slug" */
  path: string;
  /** URL slug used for storage and routing (concrete path for static pages) */
  slug: string;
  /** Display name shown in the pages panel */
  name: SitePageText;
  /** Public link / editor path (concrete URL) */
  link: string;
  /** Document title for this page */
  title?: SitePageText;
  description?: SitePageText;
  iconName?: PageDefinition["iconName"];
  dynamic?: boolean;
  examplePath?: string;
  isCustom?: boolean;
  content: UserData["content"];
  /**
   * Mobile app bar for this page. Empty object `{}` when the page has none.
   * Persisted shape uses `type: "appBar"` (Flutter contract).
   */
  appBar?: SitePageAppBar;
  /**
   * Chrome-less page (splash, onboarding). The header/footer zones are not
   * rendered and no app bar is composed into the canvas. The mobile converter
   * maps this to `{ layout: "centered", padding: 0 }` plus an entry in
   * `shellExcludeRoutes`.
   */
  fullScreen?: boolean;
};

export type SiteData = {
  /** Global theme, locale, and shell settings shared by every page */
  root: UserData["root"];
  /** Site-wide zones (shell rails, etc.) */
  zones: ZoneMap;
  pages: SitePage[];
  /**
   * Mobile sidebar block (not a zone). Empty `{}` when none.
   * Desktop continues to use `zones["root:zone-drawer"]` / ZoneDrawer.
   */
  sidebar?: SiteSidebar;
};

export function getSiteStorageKey(mode: EditorMode = "desktop") {
  return mode === "mobile"
    ? `puck-demo:${componentKey}:site:mobile`
    : `puck-demo:${componentKey}:site`;
}

/**
 * `componentKey` used to be a huge base64 hash of the block registry +
 * initialData; it is now a small constant ("v1"). Sites saved under the old
 * key would otherwise silently disappear, so on first read we adopt any
 * `puck-demo:<anything>:site` payload into the new key.
 */
function migrateLegacySiteStorageKey(): void {
  if (!isBrowser) return;

  const currentKey = getSiteStorageKey("desktop");
  if (window.localStorage.getItem(currentKey) !== null) return;

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || key === currentKey) continue;
    if (!key.startsWith("puck-demo:") || !key.endsWith(":site")) continue;
    if (key.endsWith(":site:mobile")) continue;

    const payload = window.localStorage.getItem(key);
    if (!payload) continue;

    window.localStorage.setItem(currentKey, payload);
    window.localStorage.removeItem(key);
    return;
  }
}

export function getLegacyPageStorageKey(path: string) {
  return `puck-demo:${componentKey}:${path}`;
}

export function sitePageToDefinition(page: SitePage): PageDefinition {
  return {
    path: page.path,
    label: resolveSitePageText(page.name, "ar", page.path),
    description: resolveSitePageText(page.description, "ar"),
    iconName: isValidIconName(page.iconName) ? page.iconName : "FileText",
    dynamic: page.dynamic,
    examplePath: page.examplePath,
    isCustom: page.isCustom,
  };
}

export function resolveSitePageEditPath(page: SitePage) {
  return page.examplePath ?? page.link ?? page.slug ?? page.path;
}

const matchDynamicPathPattern = (pattern: string, pathname: string): boolean => {
  // Sites authored against the pre-SitePage schema (`route` instead of `path`)
  // normalize to pages with no path; those can never match a dynamic route.
  if (typeof pattern !== "string" || !pattern.includes(":")) return false;

  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = pathname.split("/").filter(Boolean);

  if (patternSegments.length !== pathSegments.length) return false;

  return patternSegments.every(
    (segment, index) =>
      segment.startsWith(":") || segment === pathSegments[index]
  );
};

export function findSitePage(
  site: SiteData,
  editPath: string
): SitePage | undefined {
  const normalized = editPath === "" ? "/" : editPath;

  const exact = site.pages.find((page) => {
    const candidates = [
      resolveSitePageEditPath(page),
      page.link,
      page.slug,
      page.path,
    ].filter(Boolean);

    return candidates.some((candidate) => candidate === normalized);
  });

  if (exact) return exact;

  return site.pages.find((page) =>
    matchDynamicPathPattern(page.path, normalized)
  );
}

const stripShellFromContent = (
  content: UserData["content"] | undefined
): UserData["content"] => {
  if (!Array.isArray(content)) return [];

  return content.filter(
    (item) => !SHELL_COMPONENT_TYPES.has(item.type)
  ) as UserData["content"];
};

const stripMobileShellFromContent = (
  content: UserData["content"] | undefined
): UserData["content"] => {
  if (!Array.isArray(content)) return [];

  return content.filter(
    (item) =>
      !SHELL_COMPONENT_TYPES.has(item.type) &&
      item.type !== SIDEBAR_COMPONENT_TYPE
  ) as UserData["content"];
};

const extractAppBarFromContent = (
  content: UserData["content"] | undefined
): { appBar: SitePageAppBar; content: UserData["content"] } => {
  const list = Array.isArray(content) ? content : [];
  const appBarNode = list.find((item) => item.type === "AppBar") as
    | ComponentLike
    | undefined;
  return {
    appBar: appBarNode ? toPersistedAppBar(appBarNode) : emptyAppBar(),
    content: stripShellFromContent(list),
  };
};

const extractSidebarFromContent = (
  content: UserData["content"] | undefined
): { sidebar: SiteSidebar; content: UserData["content"] } => {
  const list = Array.isArray(content) ? content : [];
  const sidebarNode = list.find((item) => item.type === SIDEBAR_COMPONENT_TYPE) as
    | ComponentLike
    | undefined;
  return {
    sidebar: sidebarNode ? toPersistedSidebar(sidebarNode) : emptySidebar(),
    content: list.filter(
      (item) => item.type !== SIDEBAR_COMPONENT_TYPE
    ) as UserData["content"],
  };
};

/** Pull ZoneDrawer out of zones into `site.sidebar` for mobile Site JSON. */
export function migrateMobileDrawerToSidebar(site: SiteData): SiteData {
  let next = site;

  if (isEmptySidebar(site.sidebar)) {
    const zones = { ...(site.zones ?? {}) } as ZoneMap;
    const drawerZone = zones[ROOT_ZONE_DRAWER];
    const drawerNode = Array.isArray(drawerZone)
      ? (drawerZone.find((item) => item.type === "ZoneDrawer") as
          | ComponentLike
          | undefined)
      : undefined;

    const sidebar = sidebarFromZoneDrawer(drawerNode);
    if (!isEmptySidebar(sidebar)) {
      delete zones[ROOT_ZONE_DRAWER];
      next = { ...site, zones, sidebar };
    }
  }

  // Mobile uses `site.sidebar` (block), not the drawer zone.
  if (
    !isEmptySidebar(next.sidebar) &&
    next.zones &&
    ROOT_ZONE_DRAWER in next.zones
  ) {
    const zones = { ...next.zones } as ZoneMap;
    delete zones[ROOT_ZONE_DRAWER];
    next = { ...next, zones };
  }

  return next;
}

/**
 * Page-scoped root prop injected by `composePuckData` so `Root` can drop the
 * header/footer zones for a chrome-less page. Like `title` it never belongs to
 * the site-wide theme, so it is stripped back out before persisting.
 */
export const PAGE_FULL_SCREEN_ROOT_PROP = "pageFullScreen";

const extractGlobalRootProps = (rootProps: JsonRecord): JsonRecord => {
  const next = { ...rootProps };
  delete next.title;
  delete next[PAGE_FULL_SCREEN_ROOT_PROP];
  return next;
};

const pageDefinitionFromPath = (path: string): PageDefinition => {
  const known = PAGES.find(
    (page) => getEditPath(page) === path || page.path === path
  );

  if (known) return known;

  const label =
    path === "/"
      ? "Home"
      : path
          .split("/")
          .filter(Boolean)
          .map((segment) =>
            segment
              .split("-")
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" ")
          )
          .join(" / ") || "Page";

  return {
    path,
    label,
    description: "Custom page",
    iconName: "FileText",
    isCustom: true,
  };
};

const sitePageFromUserData = (
  definition: PageDefinition,
  pageData: Partial<UserData>
): SitePage => {
  const editPath = getEditPath(definition);
  const normalized = normalizeEditorData(pageData);
  const title =
    readString(normalized.root?.props?.title, "") || definition.label;

  return {
    path: definition.path,
    slug: definition.dynamic ? editPath : definition.path,
    name: definition.label,
    link: editPath,
    title,
    description: definition.description,
    iconName: definition.iconName,
    dynamic: definition.dynamic,
    examplePath: definition.examplePath,
    isCustom: definition.isCustom,
    content: stripShellFromContent(normalized.content),
    appBar: emptyAppBar(),
  };
};

const collectInitialPagePaths = () => {
  const paths = new Set<string>();

  PAGES.forEach((page) => paths.add(getEditPath(page)));
  Object.keys(initialData).forEach((path) => paths.add(path));

  return [...paths];
};

export function buildInitialSiteData(): SiteData {
  const homeDefinition = PAGES.find((page) => page.path === "/") ?? PAGES[0];
  const homeData = initialData["/"] ?? initialData[getEditPath(homeDefinition)];

  const homeNormalized = normalizeEditorData(
    homeData ?? { root: { props: { title: homeDefinition.label } }, content: [] }
  );

  const globalRootProps = extractGlobalRootProps(
    (homeNormalized.root?.props ?? {}) as JsonRecord
  );

  const pages: SitePage[] = [];
  const seenEditPaths = new Set<string>();

  collectInitialPagePaths().forEach((editPath) => {
    if (seenEditPaths.has(editPath)) return;
    seenEditPaths.add(editPath);

    const definition = pageDefinitionFromPath(editPath);
    const pageData =
      initialData[editPath] ??
      initialData[definition.path] ??
      ({
        root: { props: { title: definition.label } },
        content: [],
        zones: {},
      } satisfies Partial<UserData>);

    pages.push(sitePageFromUserData(definition, pageData));
  });

  return normalizeSiteData({
    root: { props: globalRootProps },
    zones: homeNormalized.zones ?? {},
    pages: dedupeSitePages(pages),
  });
}

const dedupeSitePages = (pages: SitePage[]) => {
  const seen = new Set<string>();

  return pages.filter((page) => {
    const key = page.path;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const parseLegacyCustomPages = (): PageDefinition[] => {
  if (!isBrowser) return [];

  try {
    const raw = window.localStorage.getItem(CUSTOM_PAGES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return dedupeByPath(
      parsed
        .map((entry) => {
          if (!isPlainObject(entry)) return null;
          const path = normalizePagePath(readString(entry.path, ""));
          const label = readString(entry.label, "").trim();
          if (!path || !label) return null;

          return {
            path,
            label,
            description:
              readString(entry.description, "").trim() || "Custom page",
            iconName: isValidIconName(entry.iconName)
              ? entry.iconName
              : "FileText",
            dynamic: false,
            isCustom: true,
          } satisfies PageDefinition;
        })
        .filter((entry): entry is PageDefinition => Boolean(entry))
    );
  } catch {
    return [];
  }
};

const migrateLegacyPerPageStorage = (site: SiteData): SiteData => {
  if (!isBrowser) return site;

  let nextSite = site;
  let globalRootProps = extractGlobalRootProps(
    (site.root?.props ?? {}) as JsonRecord
  );

  const pathsToScan = new Set<string>();
  site.pages.forEach((page) => pathsToScan.add(resolveSitePageEditPath(page)));
  Object.keys(initialData).forEach((path) => pathsToScan.add(path));

  pathsToScan.forEach((editPath) => {
    const legacyRaw = window.localStorage.getItem(
      getLegacyPageStorageKey(editPath)
    );
    if (!legacyRaw) return;

    try {
      const legacyData = JSON.parse(legacyRaw) as Partial<UserData>;
      const legacyNormalized = normalizeEditorData(legacyData);
      const legacyRootProps = (legacyNormalized.root?.props ?? {}) as JsonRecord;

      if (editPath === "/") {
        globalRootProps = {
          ...globalRootProps,
          ...extractGlobalRootProps(legacyRootProps),
        };
      }

      const definition = pageDefinitionFromPath(editPath);
      const migratedPage = sitePageFromUserData(definition, legacyNormalized);
      const existingIndex = nextSite.pages.findIndex(
        (page) => page.path === migratedPage.path
      );

      if (existingIndex >= 0) {
        const pages = [...nextSite.pages];
        pages[existingIndex] = { ...pages[existingIndex], ...migratedPage };
        nextSite = { ...nextSite, pages };
      } else {
        nextSite = { ...nextSite, pages: [...nextSite.pages, migratedPage] };
      }
    } catch {
      // Ignore invalid legacy payloads.
    }
  });

  parseLegacyCustomPages().forEach((definition) => {
    if (nextSite.pages.some((page) => page.path === definition.path)) return;

    const editPath = getEditPath(definition);
    const legacyRaw = window.localStorage.getItem(
      getLegacyPageStorageKey(editPath)
    );

    const pageData = legacyRaw
      ? (JSON.parse(legacyRaw) as Partial<UserData>)
      : {
          root: { props: { title: definition.label } },
          content: [],
          zones: {},
        };

    nextSite = {
      ...nextSite,
      pages: [...nextSite.pages, sitePageFromUserData(definition, pageData)],
    };
  });

  return {
    ...nextSite,
    root: { props: globalRootProps },
    pages: dedupeSitePages(nextSite.pages),
  };
};

export function normalizeSiteData(value: Partial<SiteData> | null | undefined): SiteData {
  const input = value ?? {};
  const rootNormalized = normalizeEditorData({
    root: input.root ?? { props: {} },
    content: [],
    zones: input.zones ?? {},
  });

  const pages = (Array.isArray(input.pages) ? input.pages : []).map((page) => {
    const definition = sitePageToDefinition(page as SitePage);
    // Only `composed.content` is used below — passing the (already normalized)
    // site zones here would re-normalize the same zone tree once per page for
    // a result that gets discarded.
    const pageTitleFallback: SitePageText =
      page.title ?? page.name ?? definition.label;
    const composed = normalizeEditorData({
      root: {
        props: {
          ...(rootNormalized.root?.props ?? {}),
          title: pageTitleFallback,
        },
      },
      content: page.content ?? [],
      zones: {},
    });

    const composedTitle = composed.root?.props?.title;
    const resolvedTitle: SitePageText =
      page.title ??
      (typeof composedTitle === "string" || isBilingualValue(composedTitle)
        ? (composedTitle as SitePageText)
        : definition.label);

    // Prefer explicit page.appBar; also accept an AppBar left in content (legacy).
    const fromContent = extractAppBarFromContent(composed.content);
    const fullScreen = page.fullScreen === true;
    const appBar = fullScreen
      ? emptyAppBar()
      : !isEmptyAppBar(normalizeSitePageAppBar(page.appBar))
        ? normalizeSitePageAppBar(page.appBar)
        : fromContent.appBar;

    return {
      path: definition.path,
      slug: page.slug ?? definition.path,
      name: page.name ?? definition.label,
      link: page.link ?? getEditPath(definition),
      title: resolvedTitle,
      description: page.description ?? definition.description,
      iconName: definition.iconName,
      dynamic: definition.dynamic,
      examplePath: definition.examplePath,
      isCustom: definition.isCustom,
      content: stripMobileShellFromContent(fromContent.content),
      appBar,
      fullScreen,
    } satisfies SitePage;
  });

  const sidebarFromContent = (() => {
    for (const page of Array.isArray(input.pages) ? input.pages : []) {
      const list = Array.isArray(page.content) ? page.content : [];
      const node = list.find((item) => item.type === SIDEBAR_COMPONENT_TYPE) as
        | ComponentLike
        | undefined;
      if (node) return toPersistedSidebar(node);
    }
    return emptySidebar();
  })();

  const sidebar = !isEmptySidebar(normalizeSiteSidebar(input.sidebar))
    ? normalizeSiteSidebar(input.sidebar)
    : sidebarFromContent;

  return {
    root: {
      ...(isPlainObject(input.root) ? input.root : {}),
      props: extractGlobalRootProps((rootNormalized.root?.props ?? {}) as JsonRecord),
    },
    zones: (rootNormalized.zones ?? input.zones ?? {}) as ZoneMap,
    pages: dedupeSitePages(pages.length > 0 ? pages : buildInitialSiteData().pages),
    sidebar,
  };
}

/**
 * readSiteData used to re-parse + fully re-normalize the whole site on every
 * call — and it is called from render-adjacent code (snapshots, page panels,
 * storefront hooks), so during editing this ran thousands of deep clones per
 * keystroke. Cache the normalized result keyed by the raw localStorage string:
 * same string → same (treat-as-immutable) SiteData instance.
 */
let siteReadCache: Partial<
  Record<EditorMode, { raw: string; site: SiteData }>
> = {};

function readDesktopSiteFromStorage(): SiteData {
  migrateLegacySiteStorageKey();

  const storageKey = getSiteStorageKey("desktop");
  const raw = window.localStorage.getItem(storageKey);
  if (raw) {
    const cached = siteReadCache.desktop;
    if (cached && cached.raw === raw) {
      return cached.site;
    }

    try {
      const site = normalizeSiteData(JSON.parse(raw) as SiteData);
      siteReadCache.desktop = { raw, site };
      return site;
    } catch {
      // Fall through to migration.
    }
  }

  const migrated = migrateLegacyPerPageStorage(buildInitialSiteData());
  writeSiteData(migrated, "desktop");
  return migrated;
}

/** Copy the desktop site into the mobile storage key on first mobile edit. */
export function seedMobileSiteFromDesktop(): SiteData {
  const desktop = readDesktopSiteFromStorage();
  const seeded = migrateMobileDrawerToSidebar(
    normalizeSiteData(JSON.parse(JSON.stringify(desktop)) as SiteData)
  );
  // Ensure every page has an appBar key (empty if none).
  const withAppBars: SiteData = {
    ...seeded,
    pages: seeded.pages.map((page) => ({
      ...page,
      appBar: page.appBar ?? emptyAppBar(),
    })),
    sidebar: seeded.sidebar ?? emptySidebar(),
  };
  writeSiteData(withAppBars, "mobile");
  return withAppBars;
}

export function readSiteData(mode?: EditorMode): SiteData {
  if (!isBrowser) {
    return buildInitialSiteData();
  }

  const resolvedMode = mode ?? getActiveEditorMode();

  if (resolvedMode === "desktop") {
    return readDesktopSiteFromStorage();
  }

  const storageKey = getSiteStorageKey("mobile");
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return seedMobileSiteFromDesktop();
  }

  const cached = siteReadCache.mobile;
  if (cached && cached.raw === raw) {
    return cached.site;
  }

  try {
    const site = normalizeSiteData(JSON.parse(raw) as SiteData);
    siteReadCache.mobile = { raw, site };
    return site;
  } catch {
    return seedMobileSiteFromDesktop();
  }
}

export function writeSiteData(site: SiteData, mode?: EditorMode) {
  if (!isBrowser) return;

  const resolvedMode = mode ?? getActiveEditorMode();
  const normalized = normalizeSiteData(site);
  const serialized = JSON.stringify(normalized);
  window.localStorage.setItem(getSiteStorageKey(resolvedMode), serialized);
  siteReadCache[resolvedMode] = { raw: serialized, site: normalized };
  window.dispatchEvent(new CustomEvent(PAGES_UPDATED_EVENT));
}

/** Whether a persisted mobile site blob exists (not just seeded in-memory). */
export function hasMobileSiteData(): boolean {
  if (!isBrowser) return false;
  return window.localStorage.getItem(getSiteStorageKey("mobile")) !== null;
}

/**
 * Pick desktop vs mobile site for the published storefront.
 * Honors `?mode=mobile`, then viewport width when a mobile site exists.
 */
export function resolveStorefrontMode(): EditorMode {
  if (!isBrowser) return "desktop";

  const params = new URLSearchParams(window.location.search);
  if (params.get("mode") === "mobile" && hasMobileSiteData()) {
    return "mobile";
  }

  if (!hasMobileSiteData()) {
    return "desktop";
  }

  const desktop = readSiteData("desktop");
  const bp =
    (desktop.root?.props as { breakpointMobileMax?: number } | undefined)
      ?.breakpointMobileMax ?? 767;

  if (window.matchMedia(`(max-width: ${bp}px)`).matches) {
    return "mobile";
  }

  return "desktop";
}

export function readStorefrontSiteData(): SiteData {
  const mode = resolveStorefrontMode();
  return readSiteData(mode);
}

export {
  syncMobilePageFromDesktop,
  syncMobileThemeFromDesktop,
  resetMobileSiteFromDesktop,
} from "./mobile-sync";

export { applyMobileEditorFieldGroups } from "./mobile-field-groups";

export function composePuckData(site: SiteData, editPath: string): UserData {
  const page = findSitePage(site, editPath);
  const mode = getActiveEditorMode();

  if (!page) {
    return normalizeEditorData({
      root: site.root,
      content: [],
      zones: site.zones ?? {},
    });
  }

  let content = [...(page.content ?? [])] as UserData["content"];
  const fullScreen = page.fullScreen === true;

  if (mode === "mobile" && !fullScreen) {
    const shell: UserData["content"] = [];

    const appBarNode = toEditorAppBarNode(page.appBar ?? emptyAppBar());
    if (appBarNode) {
      shell.push(appBarNode as UserData["content"][number]);
    }

    const sidebarNode = toEditorSidebarNode(site.sidebar ?? emptySidebar());
    if (sidebarNode) {
      shell.push(sidebarNode as UserData["content"][number]);
    }

    // Avoid duplicating if content already carries them (unsaved edit path).
    const withoutShell = stripMobileShellFromContent(content);
    content = [...shell, ...withoutShell] as UserData["content"];
  } else if (mode === "mobile") {
    content = stripMobileShellFromContent(content);
  }

  return normalizeEditorData({
    root: {
      ...(site.root ?? { props: {} }),
      props: {
        ...((site.root?.props ?? {}) as JsonRecord),
        title: page.title ?? page.name,
        [PAGE_FULL_SCREEN_ROOT_PROP]: fullScreen,
      },
    },
    content,
    zones: site.zones ?? {},
  });
}

export function applyPuckSave(
  site: SiteData,
  editPath: string,
  puckData: UserData
): SiteData {
  const normalized = normalizeEditorData(puckData);
  const pageTitle = readString(normalized.root?.props?.title, "");
  const globalRootProps = extractGlobalRootProps(
    (normalized.root?.props ?? {}) as JsonRecord
  );
  const mode = getActiveEditorMode();

  const matchedPage = findSitePage(site, editPath);
  const pageIndex = matchedPage
    ? site.pages.findIndex((page) => page.path === matchedPage.path)
    : -1;

  // A chrome-less page never composes the app bar or the site sidebar into the
  // canvas, so this save carries no evidence about either — reading them back
  // out would clear both.
  const editsMobileShell = mode === "mobile" && matchedPage?.fullScreen !== true;

  const { appBar: extractedAppBar, content: afterAppBar } =
    extractAppBarFromContent(normalized.content);
  const { sidebar: extractedSidebar, content: pageContent } = editsMobileShell
    ? extractSidebarFromContent(afterAppBar)
    : { sidebar: site.sidebar ?? emptySidebar(), content: afterAppBar };

  const updatedPages =
    pageIndex >= 0
      ? site.pages.map((page, index) =>
          index === pageIndex
            ? {
                ...page,
                title: pageTitle || page.title || page.name,
                content: stripMobileShellFromContent(pageContent),
                // `normalizeSiteData` below forces `{}` on full-screen pages.
                appBar: editsMobileShell
                  ? extractedAppBar
                  : (page.appBar ?? emptyAppBar()),
              }
            : page
        )
      : [
          ...site.pages,
          {
            path: editPath,
            slug: editPath,
            name: pageTitle || editPath,
            link: editPath,
            title: pageTitle || editPath,
            description: "Custom page",
            iconName: "FileText" as const,
            isCustom: true,
            content: stripMobileShellFromContent(pageContent),
            appBar: editsMobileShell ? extractedAppBar : emptyAppBar(),
          },
        ];

  const nextSidebar = editsMobileShell
    ? // If the merchant removed the Sidebar block, keep previous unless they
      // explicitly had one in content this save (extracted empty = cleared).
      extractedSidebar
    : (site.sidebar ?? emptySidebar());

  return normalizeSiteData({
    root: {
      ...(site.root ?? { props: {} }),
      props: globalRootProps,
    },
    zones: normalized.zones ?? site.zones ?? {},
    pages: updatedPages,
    sidebar: nextSidebar,
  });
}

export function addSitePage(
  site: SiteData,
  definition: Pick<SitePage, "path" | "name" | "link"> &
    Partial<Omit<SitePage, "path" | "name" | "link" | "content">>,
  starterContent?: UserData["content"]
): SiteData {
  const path = normalizePagePath(definition.path);
  if (!path) return site;

  if (site.pages.some((page) => page.path === path)) {
    return site;
  }

  const link = normalizePagePath(definition.link ?? path) ?? path;

  return normalizeSiteData({
    ...site,
    pages: [
      ...site.pages,
      {
        path,
        slug: path,
        name: definition.name,
        link,
        title: definition.title ?? definition.name,
        description: definition.description ?? "Custom page",
        iconName: definition.iconName ?? "FileText",
        dynamic: definition.dynamic,
        examplePath: definition.examplePath,
        isCustom: definition.isCustom ?? true,
        content: starterContent ?? [],
        appBar: definition.appBar ?? emptyAppBar(),
        fullScreen: definition.fullScreen ?? false,
      },
    ],
  });
}

/**
 * Delete a merchant-created page (and its content) by route pattern.
 *
 * Built-in pages are refused: the storefront routes, the pages menu and
 * `buildInitialSiteData` all assume `/`, `/cart`, `/products/:product-slug` &
 * co. exist, and `normalizeSiteData` would re-seed them anyway. Returns the
 * same `site` reference when nothing was removed, so callers can skip the
 * write.
 */
export function removeSitePage(site: SiteData, path: string): SiteData {
  const normalized = normalizePagePath(path) ?? path;

  const target = site.pages.find((page) => page.path === normalized);
  if (!target || !target.isCustom) return site;

  return normalizeSiteData({
    ...site,
    pages: site.pages.filter((page) => page.path !== normalized),
  });
}
