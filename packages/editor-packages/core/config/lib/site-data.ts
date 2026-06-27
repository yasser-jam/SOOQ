import { componentKey } from "../index";
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
import type { UserData } from "../types";

type JsonRecord = Record<string, unknown>;
type ZoneMap = NonNullable<UserData["zones"]>;

type ComponentLike = {
  type: string;
  props: JsonRecord;
};

/** @deprecated Legacy custom-page registry key — migrated into SiteData.pages */
export const CUSTOM_PAGES_STORAGE_KEY = "puck-demo-custom-pages:v1";

const SHELL_COMPONENT_TYPES = new Set([
  "SiteHeader",
  "SiteFooter",
  "SiteDrawerShell",
]);

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
  name: string;
  /** Public link / editor path (concrete URL) */
  link: string;
  /** Document title for this page */
  title?: string;
  description?: string;
  iconName?: PageDefinition["iconName"];
  dynamic?: boolean;
  examplePath?: string;
  isCustom?: boolean;
  content: UserData["content"];
};

export type SiteData = {
  /** Global theme, locale, and shell settings shared by every page */
  root: UserData["root"];
  /** Site-wide zones (shell rails, etc.) */
  zones: ZoneMap;
  pages: SitePage[];
};

export function getSiteStorageKey() {
  return `puck-demo:${componentKey}:site`;
}

export function getLegacyPageStorageKey(path: string) {
  return `puck-demo:${componentKey}:${path}`;
}

export function sitePageToDefinition(page: SitePage): PageDefinition {
  return {
    path: page.path,
    label: page.name,
    description: page.description ?? "",
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
  if (!pattern.includes(":")) return false;

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

const extractGlobalRootProps = (rootProps: JsonRecord): JsonRecord => {
  const next = { ...rootProps };
  delete next.title;
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
    const composed = normalizeEditorData({
      root: {
        props: {
          ...(rootNormalized.root?.props ?? {}),
          title: page.title ?? page.name ?? definition.label,
        },
      },
      content: page.content ?? [],
      zones: rootNormalized.zones ?? {},
    });

    return {
      path: definition.path,
      slug: page.slug ?? definition.path,
      name: page.name ?? definition.label,
      link: page.link ?? getEditPath(definition),
      title: page.title ?? readString(composed.root?.props?.title, definition.label),
      description: page.description ?? definition.description,
      iconName: definition.iconName,
      dynamic: definition.dynamic,
      examplePath: definition.examplePath,
      isCustom: definition.isCustom,
      content: stripShellFromContent(composed.content),
    } satisfies SitePage;
  });

  return {
    root: {
      ...(isPlainObject(input.root) ? input.root : {}),
      props: extractGlobalRootProps((rootNormalized.root?.props ?? {}) as JsonRecord),
    },
    zones: (rootNormalized.zones ?? input.zones ?? {}) as ZoneMap,
    pages: dedupeSitePages(pages.length > 0 ? pages : buildInitialSiteData().pages),
  };
}

export function readSiteData(): SiteData {
  if (!isBrowser) {
    return buildInitialSiteData();
  }

  const raw = window.localStorage.getItem(getSiteStorageKey());
  if (raw) {
    try {
      return normalizeSiteData(JSON.parse(raw) as SiteData);
    } catch {
      // Fall through to migration.
    }
  }

  const migrated = migrateLegacyPerPageStorage(buildInitialSiteData());
  writeSiteData(migrated);
  return migrated;
}

export function writeSiteData(site: SiteData) {
  if (!isBrowser) return;

  const normalized = normalizeSiteData(site);
  window.localStorage.setItem(getSiteStorageKey(), JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(PAGES_UPDATED_EVENT));
}

export function composePuckData(site: SiteData, editPath: string): UserData {
  const page = findSitePage(site, editPath);

  if (!page) {
    return normalizeEditorData({
      root: site.root,
      content: [],
      zones: site.zones ?? {},
    });
  }

  return normalizeEditorData({
    root: {
      ...(site.root ?? { props: {} }),
      props: {
        ...((site.root?.props ?? {}) as JsonRecord),
        title: page.title ?? page.name,
      },
    },
    content: page.content ?? [],
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

  const matchedPage = findSitePage(site, editPath);
  const pageIndex = matchedPage
    ? site.pages.findIndex((page) => page.path === matchedPage.path)
    : -1;

  const updatedPages =
    pageIndex >= 0
      ? site.pages.map((page, index) =>
          index === pageIndex
            ? {
                ...page,
                title: pageTitle || page.title || page.name,
                content: stripShellFromContent(normalized.content),
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
            content: stripShellFromContent(normalized.content),
          },
        ];

  return normalizeSiteData({
    root: {
      ...(site.root ?? { props: {} }),
      props: globalRootProps,
    },
    zones: normalized.zones ?? site.zones ?? {},
    pages: updatedPages,
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
      },
    ],
  });
}
