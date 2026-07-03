import { generateId } from "@/core/lib/generate-id";
import config from "../index";
import { DEFAULT_ZONE_FOOTER_PRESET } from "../presets/footer";
import { DEFAULT_ZONE_HEADER_PRESET } from "../presets/header";
import type { UserData } from "../types";
import {
  ROOT_SHELL_LEFT_ZONE,
  ROOT_SHELL_RIGHT_ZONE,
  ROOT_ZONE_DRAWER,
  ROOT_ZONE_FOOTER,
  ROOT_ZONE_HEADER,
  ROOT_ZONE_POPUP,
  ROOT_ZONE_BOTTOM_SHEET,
  SHELL_LEFT_ZONE,
  SHELL_RIGHT_ZONE,
  ZONE_BLOCK_TYPES,
  ZONE_DRAWER,
  ZONE_FOOTER,
  ZONE_HEADER,
  ZONE_POPUP,
  ZONE_BOTTOM_SHEET,
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
const CURRENT_SHELL_MIGRATION_VERSION = 3;

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

    const canonicalZoneNameValue = canonicalZoneName(zoneName);

    const normalizedItems = rawItems
      .filter((item) => isComponentNode(item))
      .map((item) => normalizeComponentNode(item, components)) as UserData["content"];

    const existing = Array.isArray(nextZones[canonicalZoneNameValue])
      ? (nextZones[canonicalZoneNameValue] as UserData["content"])
      : [];

    nextZones[canonicalZoneNameValue] = [...existing, ...normalizedItems];
  });

  return nextZones;
};

const ZONE_COMPONENT_TYPES = new Set<string>(ZONE_BLOCK_TYPES);

const getZoneForComponentType = (type: string): string | null => {
  switch (type) {
    case "SiteHeader":
      return ROOT_ZONE_HEADER;
    case "SiteFooter":
      return ROOT_ZONE_FOOTER;
    case "SiteDrawerShell":
    case "ZoneDrawer":
      return ROOT_ZONE_DRAWER;
    case "ZonePopup":
      return ROOT_ZONE_POPUP;
    case "ZoneBottomSheet":
      return ROOT_ZONE_BOTTOM_SHEET;
    default:
      return null;
  }
};

const canonicalZoneName = (zoneName: string): string => {
  const legacyZoneAliases: Record<string, string> = {
    "zone:header": ROOT_ZONE_HEADER,
    "root:zone:header": ROOT_ZONE_HEADER,
    "zone:footer": ROOT_ZONE_FOOTER,
    "root:zone:footer": ROOT_ZONE_FOOTER,
    "zone:drawer": ROOT_ZONE_DRAWER,
    "root:zone:drawer": ROOT_ZONE_DRAWER,
    "zone:popup": ROOT_ZONE_POPUP,
    "root:zone:popup": ROOT_ZONE_POPUP,
    "zone:bottom-sheet": ROOT_ZONE_BOTTOM_SHEET,
    "root:zone:bottom-sheet": ROOT_ZONE_BOTTOM_SHEET,
  };

  if (legacyZoneAliases[zoneName]) {
    return legacyZoneAliases[zoneName];
  }

  if (zoneName === SHELL_LEFT_ZONE) return ROOT_SHELL_LEFT_ZONE;
  if (zoneName === SHELL_RIGHT_ZONE) return ROOT_SHELL_RIGHT_ZONE;
  if (zoneName === ZONE_HEADER) return ROOT_ZONE_HEADER;
  if (zoneName === ZONE_FOOTER) return ROOT_ZONE_FOOTER;
  if (zoneName === ZONE_DRAWER) return ROOT_ZONE_DRAWER;
  if (zoneName === ZONE_POPUP) return ROOT_ZONE_POPUP;
  if (zoneName === ZONE_BOTTOM_SHEET) return ROOT_ZONE_BOTTOM_SHEET;
  return zoneName;
};

const pushToZone = (
  zones: ZoneMap,
  zoneKey: string,
  item: ComponentLike,
  replaceType?: string
) => {
  const existing = Array.isArray(zones[zoneKey])
    ? (zones[zoneKey] as ComponentLike[])
    : [];

  const filtered = replaceType
    ? existing.filter((entry) => entry.type !== replaceType)
    : existing;

  zones[zoneKey] = [...filtered, item] as UserData["content"];
};

const ensurePresetZoneContent = (
  zones: ZoneMap,
  zoneKey: string,
  defaultPreset: { componentData: ComponentLike },
  components: ComponentDefaults
) => {
  const rawItems = (zones[zoneKey] ?? []) as ComponentLike[];

  const migrated = rawItems
    .map((item) => {
      if (item.type === "SiteHeader" || item.type === "SiteFooter") {
        return normalizeComponentNode(defaultPreset.componentData, components);
      }
      return normalizeComponentNode(item, components);
    })
    .filter((item) => item.type !== "SiteHeader" && item.type !== "SiteFooter");

  const sections = migrated.filter((item) => item.type === "Section");

  zones[zoneKey] = (
    sections.length > 0
      ? [sections[0]]
      : [normalizeComponentNode(defaultPreset.componentData, components)]
  ) as UserData["content"];
};

const enforceShellPlacement = (
  content: ComponentLike[],
  zones: ZoneMap,
  rootProps: JsonRecord,
  components: ComponentDefaults,
  insertMissingShell: boolean
): { content: ComponentLike[]; zones: ZoneMap } => {
  const nextZones = {} as ZoneMap;

  Object.entries(zones).forEach(([zoneName, rawItems]) => {
    const canonical = canonicalZoneName(zoneName);
    if (!Array.isArray(rawItems)) return;

    const existing = Array.isArray(nextZones[canonical])
      ? (nextZones[canonical] as ComponentLike[])
      : [];

    const normalizedItems = rawItems
      .filter((item) => isComponentNode(item))
      .map((item) => normalizeComponentNode(item, components));

    nextZones[canonical] = [...existing, ...normalizedItems] as UserData["content"];
  });

  const nextContent: ComponentLike[] = [];

  content.forEach((item) => {
    if (item.type === "SiteHeader") {
      pushToZone(
        nextZones,
        ROOT_ZONE_HEADER,
        normalizeComponentNode(
          DEFAULT_ZONE_HEADER_PRESET.componentData,
          components
        ),
        "SiteHeader"
      );
      return;
    }

    if (item.type === "SiteFooter") {
      pushToZone(
        nextZones,
        ROOT_ZONE_FOOTER,
        normalizeComponentNode(
          DEFAULT_ZONE_FOOTER_PRESET.componentData,
          components
        ),
        "SiteFooter"
      );
      return;
    }

    if (!ZONE_COMPONENT_TYPES.has(item.type)) {
      nextContent.push(item);
      return;
    }

    const zoneKey = getZoneForComponentType(item.type);
    if (!zoneKey) {
      nextContent.push(item);
      return;
    }

    const normalized = normalizeComponentNode(item, components);
    pushToZone(nextZones, zoneKey, normalized);
  });

  ensurePresetZoneContent(
    nextZones,
    ROOT_ZONE_HEADER,
    DEFAULT_ZONE_HEADER_PRESET,
    components
  );
  ensurePresetZoneContent(
    nextZones,
    ROOT_ZONE_FOOTER,
    DEFAULT_ZONE_FOOTER_PRESET,
    components
  );

  // Migrate legacy shell-rail drawers into the drawer zone.
  [ROOT_SHELL_LEFT_ZONE, ROOT_SHELL_RIGHT_ZONE].forEach((legacyZone) => {
    const legacyItems = (nextZones[legacyZone] ?? []) as ComponentLike[];
    legacyItems.forEach((item) => {
      if (item.type !== "SiteDrawerShell") return;
      pushToZone(nextZones, ROOT_ZONE_DRAWER, item, "SiteDrawerShell");
    });
    delete nextZones[legacyZone];
  });

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

  const existingId =
    typeof normalizedProps.id === "string" && normalizedProps.id.trim()
      ? normalizedProps.id
      : typeof item.props.id === "string" && item.props.id.trim()
        ? item.props.id
        : generateId(item.type);

  return {
    ...item,
    props: {
      ...normalizedProps,
      id: existingId,
    },
  };
};

/** Fix duplicate or type-only ids (e.g. multiple `Group` blocks all named "Group"). */
const ensureUniqueComponentIds = (data: {
  content: ComponentLike[];
  zones: ZoneMap;
}): { content: UserData["content"]; zones: ZoneMap } => {
  const seen = new Set<string>();

  const fixValue = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map(fixValue);
    }

    if (isComponentNode(value)) {
      return fixComponent(value);
    }

    if (!isPlainObject(value)) {
      return value;
    }

    const next: JsonRecord = {};
    Object.entries(value).forEach(([key, entry]) => {
      next[key] = fixValue(entry);
    });
    return next;
  };

  const fixComponent = (item: ComponentLike): ComponentLike => {
    const props = fixValue(item.props) as JsonRecord;
    let id = props.id;

    if (
      typeof id !== "string" ||
      !id.trim() ||
      seen.has(id) ||
      id === item.type
    ) {
      id = generateId(item.type);
    }

    seen.add(id);

    return {
      ...item,
      props: {
        ...props,
        id,
      },
    };
  };

  const content = data.content.map(fixComponent) as UserData["content"];
  const zones = Object.entries(data.zones).reduce<ZoneMap>((acc, [zoneKey, items]) => {
    acc[zoneKey] = (Array.isArray(items) ? items : []).map(fixComponent) as UserData["content"];
    return acc;
  }, {} as ZoneMap);

  return { content, zones };
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

  const { content: uniqueContent, zones: uniqueZones } = ensureUniqueComponentIds({
    content: shellPlacementResult.content as ComponentLike[],
    zones: shellPlacementResult.zones,
  });

  return {
    ...input,
    root: {
      ...(isPlainObject(input.root) ? input.root : {}),
      props: rootPropsWithMigrationFlag,
    },
    content: uniqueContent,
    zones: uniqueZones,
  } as UserData;
}
