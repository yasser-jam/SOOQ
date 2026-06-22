import config from "../index";
import type { UserData } from "../types";
import {
  ROOT_SHELL_LEFT_ZONE,
  ROOT_SHELL_RIGHT_ZONE,
  SHELL_LEFT_ZONE,
  SHELL_RIGHT_ZONE,
} from "../shell-zones";

type JsonRecord = Record<string, unknown>;
type ComponentDefaults = Record<string, { defaultProps?: JsonRecord }>;
type ZoneMap = NonNullable<UserData["zones"]>;
type ComponentLike = {
  type: string;
  props: JsonRecord;
  readOnly?: unknown;
};

const SHELL_MIGRATION_VERSION_KEY = "shellComponentsMigrationVersion";
const CURRENT_SHELL_MIGRATION_VERSION = 2;

const isPlainObject = (value: unknown): value is JsonRecord => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const cloneDeep = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => cloneDeep(item)) as T;
  }

  if (isPlainObject(value)) {
    const next: JsonRecord = {};
    Object.entries(value).forEach(([key, itemValue]) => {
      next[key] = cloneDeep(itemValue);
    });

    return next as T;
  }

  return value;
};

const mergeDefaults = (defaults: unknown, incoming: unknown): unknown => {
  if (incoming === undefined) {
    return cloneDeep(defaults);
  }

  if (Array.isArray(defaults)) {
    return Array.isArray(incoming) ? incoming : cloneDeep(defaults);
  }

  if (isPlainObject(defaults) && isPlainObject(incoming)) {
    const next: JsonRecord = {};
    const keySet = new Set([
      ...Object.keys(defaults),
      ...Object.keys(incoming),
    ]);

    keySet.forEach((key) => {
      const defaultValue = defaults[key];
      const incomingValue = incoming[key];

      if (incomingValue === undefined) {
        next[key] = cloneDeep(defaultValue);
        return;
      }

      if (defaultValue === undefined) {
        next[key] = incomingValue;
        return;
      }

      next[key] = mergeDefaults(defaultValue, incomingValue);
    });

    return next;
  }

  return incoming;
};

const stripVisualOnlyKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => stripVisualOnlyKeys(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const next: JsonRecord = {};

  Object.entries(value).forEach(([key, itemValue]) => {
    if (key.startsWith("__")) {
      return;
    }

    next[key] = stripVisualOnlyKeys(itemValue);
  });

  return next;
};

const toStructuredLink = (href: string): JsonRecord => {
  const trimmed = href.trim();
  if (!trimmed || trimmed === "#") {
    return { kind: "none" };
  }

  if (trimmed.startsWith("#")) {
    return { kind: "anchor", hash: trimmed.replace(/^#/, "") };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return { kind: "external", url: trimmed };
  }

  return { kind: "page", pageId: trimmed };
};

const normalizeLegacyShellLinkItem = (value: unknown): unknown => {
  if (!isPlainObject(value)) {
    return value;
  }

  if (isPlainObject(value.link)) {
    return value;
  }

  if (typeof value.href !== "string") {
    return value;
  }

  return {
    ...value,
    link: toStructuredLink(value.href),
  };
};

const migrateLegacyShellLinks = (rootProps: JsonRecord): JsonRecord => {
  const next = { ...rootProps };

  if (Array.isArray(next.headerLinks)) {
    next.headerLinks = next.headerLinks.map((item) =>
      normalizeLegacyShellLinkItem(item)
    );
  }

  if (Array.isArray(next.drawerLinks)) {
    next.drawerLinks = next.drawerLinks.map((item) =>
      normalizeLegacyShellLinkItem(item)
    );
  }

  if (Array.isArray(next.footerColumns)) {
    next.footerColumns = next.footerColumns.map((column) => {
      if (!isPlainObject(column)) {
        return column;
      }

      if (!Array.isArray(column.links)) {
        return column;
      }

      return {
        ...column,
        links: column.links.map((item) => normalizeLegacyShellLinkItem(item)),
      };
    });
  }

  return next;
};

const readString = (value: unknown, fallback = ""): string => {
  return typeof value === "string" ? value : fallback;
};

const readBoolean = (value: unknown, fallback: boolean): boolean => {
  return typeof value === "boolean" ? value : fallback;
};

const readNumber = (value: unknown, fallback: number): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const buildSiteHeaderPropsFromRoot = (rootProps: JsonRecord): JsonRecord => {
  const siteTitle = readString(rootProps.title, "");
  const headerTitle =
    typeof rootProps.headerBrandTitle === "string"
      ? rootProps.headerBrandTitle
      : siteTitle;

  return {
    id: "SiteHeader-shell",
    title: headerTitle,
    variant: readString(rootProps.headerVariant, "commerce"),
    language: readString(rootProps.language, "ar"),
    visible: readBoolean(rootProps.headerVisible, true),
    brandHref: readString(rootProps.headerBrandHref, "/"),
    links: Array.isArray(rootProps.headerLinks) ? rootProps.headerLinks : [],
    backgroundColor: readString(rootProps.headerBackgroundColor, ""),
    textColor: readString(rootProps.headerTextColor, ""),
    showDrawerButton: readBoolean(rootProps.headerShowDrawerButton, false),
    drawerButtonIcon: readString(rootProps.headerDrawerButtonIcon, "menu"),
    drawerName: "site-drawer",
  };
};

const buildSiteFooterPropsFromRoot = (rootProps: JsonRecord): JsonRecord => {
  const siteTitle = readString(rootProps.title, "");
  const footerTitle =
    typeof rootProps.footerBrandTitle === "string"
      ? rootProps.footerBrandTitle
      : siteTitle;

  return {
    id: "SiteFooter-shell",
    title: footerTitle,
    variant: readString(rootProps.footerVariant, "commerce"),
    language: readString(rootProps.language, "ar"),
    visible: readBoolean(rootProps.footerVisible, true),
    tagline: readString(rootProps.footerTagline, ""),
    taglineAr: readString(rootProps.footerTaglineAr, ""),
    columns: Array.isArray(rootProps.footerColumns) ? rootProps.footerColumns : [],
    backgroundColor: readString(rootProps.footerBackgroundColor, ""),
    textColor: readString(rootProps.footerTextColor, ""),
  };
};

const buildSiteDrawerPropsFromRoot = (rootProps: JsonRecord): JsonRecord => {
  return {
    id: "SiteDrawer-shell",
    name: "site-drawer",
    enabled: readBoolean(rootProps.drawerEnabled, false),
    side: readString(rootProps.drawerSide, "left"),
    widthPx: readNumber(rootProps.drawerWidthPx, 320),
    animation: readString(rootProps.drawerAnimation, "slide"),
    animationDurationMs: readNumber(rootProps.drawerAnimationDurationMs, 260),
    trigger: readString(rootProps.drawerTrigger, "external"),
    triggerLabel: readString(rootProps.drawerTriggerLabel, "Menu"),
    triggerLabelAr: readString(rootProps.drawerTriggerLabelAr, "القائمة"),
    triggerIcon: readString(rootProps.drawerTriggerIcon, "menu"),
    title: readString(rootProps.drawerTitle, "Menu"),
    titleAr: readString(rootProps.drawerTitleAr, "القائمة"),
    showTitle: readBoolean(rootProps.drawerShowTitle, true),
    links: Array.isArray(rootProps.drawerLinks) ? rootProps.drawerLinks : [],
    backgroundColor: readString(rootProps.drawerBackgroundColor, "#ffffff"),
    textColor: readString(rootProps.drawerTextColor, "#111827"),
    accentColor: readString(rootProps.drawerAccentColor, "#2563eb"),
    triggerBackgroundColor: readString(
      rootProps.drawerTriggerBackgroundColor,
      "#ffffff"
    ),
    triggerTextColor: readString(rootProps.drawerTriggerTextColor, "#111827"),
    overlay: readBoolean(rootProps.drawerOverlay, true),
    overlayOpacityPercent: readNumber(rootProps.drawerOverlayOpacityPercent, 50),
    closeOnOverlayClick: readBoolean(rootProps.drawerCloseOnOverlayClick, true),
    closeOnEsc: readBoolean(rootProps.drawerCloseOnEsc, true),
    showCloseButton: readBoolean(rootProps.drawerShowCloseButton, true),
    startOpen: readBoolean(rootProps.drawerStartOpen, false),
    showOnMobile: readBoolean(rootProps.drawerShowOnMobile, true),
    showOnDesktop: readBoolean(rootProps.drawerShowOnDesktop, true),
    language: readString(rootProps.language, "ar"),
  };
};

const normalizeZones = (
  zonesValue: unknown,
  components: ComponentDefaults
): ZoneMap => {
  const nextZones = {} as ZoneMap;

  if (!isPlainObject(zonesValue)) {
    return nextZones;
  }

  Object.entries(zonesValue).forEach(([zoneName, rawItems]) => {
    if (!Array.isArray(rawItems)) {
      return;
    }

    const canonicalZoneName =
      zoneName === SHELL_LEFT_ZONE
        ? ROOT_SHELL_LEFT_ZONE
        : zoneName === SHELL_RIGHT_ZONE
        ? ROOT_SHELL_RIGHT_ZONE
        : zoneName;

    const normalizedItems = rawItems
      .filter((item) => isComponentNode(item))
      .map((item) => normalizeComponentNode(item, components)) as UserData["content"];

    const existing = Array.isArray(nextZones[canonicalZoneName])
      ? (nextZones[canonicalZoneName] as UserData["content"])
      : [];

    nextZones[canonicalZoneName] = [...existing, ...normalizedItems];
  });

  return nextZones;
};

const getShellDrawerZone = (side: unknown): string => {
  return side === "right" ? ROOT_SHELL_RIGHT_ZONE : ROOT_SHELL_LEFT_ZONE;
};

const getShellDrawerSideFromZone = (zoneName: string): "left" | "right" | null => {
  if (zoneName === ROOT_SHELL_RIGHT_ZONE || zoneName === SHELL_RIGHT_ZONE) {
    return "right";
  }

  if (zoneName === ROOT_SHELL_LEFT_ZONE || zoneName === SHELL_LEFT_ZONE) {
    return "left";
  }

  return null;
};

const enforceShellPlacement = (
  content: ComponentLike[],
  zones: ZoneMap,
  rootProps: JsonRecord,
  components: ComponentDefaults,
  insertMissingShell: boolean
): { content: ComponentLike[]; zones: ZoneMap } => {
  let nextContent = [...content];
  const nextZones = { ...zones } as ZoneMap;

  let shellDrawer: ComponentLike | null = null;

  // Remove drawer shells from center content; they belong to side zones.
  nextContent = nextContent.filter((item) => {
    if (item.type !== "SiteDrawerShell") {
      return true;
    }

    if (!shellDrawer) {
      shellDrawer = item;
    }

    return false;
  });

  let hasLegacyDrawer = nextContent.some((item) => item.type === "SideDrawer");

  Object.entries(nextZones).forEach(([zoneName, rawItems]) => {
    if (!Array.isArray(rawItems)) {
      delete nextZones[zoneName];
      return;
    }

    const sanitized: ComponentLike[] = [];

    rawItems.forEach((item) => {
      if (!isComponentNode(item)) {
        return;
      }

      const normalized = normalizeComponentNode(item, components);

      if (normalized.type === "SiteDrawerShell") {
        const zoneSide = getShellDrawerSideFromZone(zoneName);
        const sideAligned =
          zoneSide == null || normalized.props.side === zoneSide
            ? normalized
            : {
                ...normalized,
                props: {
                  ...normalized.props,
                  side: zoneSide,
                },
              };

        // Last observed drawer wins so explicit placement edits (e.g. right rail)
        // are preserved when legacy/stale duplicates exist.
        shellDrawer = sideAligned;
        return;
      }

      if (normalized.type === "SideDrawer") {
        hasLegacyDrawer = true;
      }

      sanitized.push(normalized);
    });

    nextZones[zoneName] = sanitized as UserData["content"];
  });

  if (!shellDrawer && insertMissingShell && !hasLegacyDrawer) {
    shellDrawer = normalizeComponentNode(
      {
        type: "SiteDrawerShell",
        props: buildSiteDrawerPropsFromRoot(rootProps),
      },
      components
    );
  }

  if (shellDrawer) {
    const targetZone = getShellDrawerZone(shellDrawer.props.side);
    const targetZoneItems = Array.isArray(nextZones[targetZone])
      ? (nextZones[targetZone] as ComponentLike[])
      : [];

    nextZones[targetZone] = [
      shellDrawer,
      ...targetZoneItems.filter((item) => item.type !== "SiteDrawerShell"),
    ] as UserData["content"];
  }

  if (!insertMissingShell) {
    return { content: nextContent, zones: nextZones };
  }

  const hasHeader = nextContent.some((item) => item.type === "SiteHeader");
  if (!hasHeader) {
    nextContent.unshift(
      normalizeComponentNode(
        {
          type: "SiteHeader",
          props: buildSiteHeaderPropsFromRoot(rootProps),
        },
        components
      )
    );
  }

  const hasFooter = nextContent.some((item) => item.type === "SiteFooter");
  if (!hasFooter) {
    nextContent.push(
      normalizeComponentNode(
        {
          type: "SiteFooter",
          props: buildSiteFooterPropsFromRoot(rootProps),
        },
        components
      )
    );
  }

  return { content: nextContent, zones: nextZones };
};

const isComponentNode = (value: unknown): value is ComponentLike => {
  if (!isPlainObject(value)) {
    return false;
  }

  const itemType = value.type;
  const itemProps = value.props;

  return typeof itemType === "string" && isPlainObject(itemProps);
};

const normalizeNestedComponents = (
  value: unknown,
  components: ComponentDefaults
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) =>
      isComponentNode(item)
        ? normalizeComponentNode(item, components)
        : normalizeNestedComponents(item, components)
    );
  }

  if (isComponentNode(value)) {
    return normalizeComponentNode(value, components);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const next: JsonRecord = {};

  Object.entries(value).forEach(([key, itemValue]) => {
    next[key] = normalizeNestedComponents(itemValue, components);
  });

  return next;
};

const normalizeComponentNode = (
  item: ComponentLike,
  components: ComponentDefaults
): ComponentLike => {
  const defaultProps = components[item.type]?.defaultProps ?? {};
  const mergedProps = mergeDefaults(
    defaultProps,
    isPlainObject(item.props) ? item.props : {}
  );

  const cleanedProps = stripVisualOnlyKeys(mergedProps);

  const normalizedProps = normalizeNestedComponents(
    cleanedProps,
    components
  ) as JsonRecord;
  const fallbackId =
    typeof item.props.id === "string" ? item.props.id : item.type;

  return {
    ...item,
    props: {
      ...normalizedProps,
      id:
        typeof normalizedProps.id === "string"
          ? normalizedProps.id
          : fallbackId,
    },
  };
};

/**
 * Ensures the saved editor payload is serializable, forward-compatible, and
 * complete (root + block default props merged, plus visual-only keys removed).
 */
export function normalizeEditorData(
  value: Partial<UserData> | undefined | null
): UserData {
  const input = (value ?? {}) as Partial<UserData>;
  const components = config.components as ComponentDefaults;

  const rootDefaults = (config.root?.defaultProps ?? {}) as JsonRecord;
  const incomingRoot = isPlainObject(
    (input.root as JsonRecord | undefined)?.props
  )
    ? ((input.root as JsonRecord).props as JsonRecord)
    : isPlainObject(input.root)
    ? (input.root as JsonRecord)
    : {};

  const normalizedRootProps = normalizeNestedComponents(
    stripVisualOnlyKeys(mergeDefaults(rootDefaults, incomingRoot)),
    components
  ) as JsonRecord;
  const migratedRootProps = migrateLegacyShellLinks(normalizedRootProps);
  const existingShellMigrationVersion =
    typeof migratedRootProps[SHELL_MIGRATION_VERSION_KEY] === "number"
      ? (migratedRootProps[SHELL_MIGRATION_VERSION_KEY] as number)
      : 0;
  const shouldInsertMissingShell =
    existingShellMigrationVersion < CURRENT_SHELL_MIGRATION_VERSION;

  const content = Array.isArray(input.content) ? input.content : [];
  const normalizedContent = content
    .filter((item) => isComponentNode(item))
    .map((item) => normalizeComponentNode(item, components)) as ComponentLike[];

  const normalizedZones = normalizeZones(
    (input as JsonRecord).zones,
    components
  );

  const shellPlacementResult = enforceShellPlacement(
    normalizedContent,
    normalizedZones,
    migratedRootProps,
    components,
    shouldInsertMissingShell
  );

  const rootPropsWithMigrationFlag = {
    ...migratedRootProps,
    [SHELL_MIGRATION_VERSION_KEY]: CURRENT_SHELL_MIGRATION_VERSION,
  };

  return {
    ...input,
    root: {
      ...(isPlainObject(input.root) ? input.root : {}),
      props: rootPropsWithMigrationFlag,
    },
    content: shellPlacementResult.content as UserData["content"],
    zones: shellPlacementResult.zones,
  } as UserData;
}
