/**
 * Site-level Sidebar for mobile — persisted outside zones as `SiteData.sidebar`.
 * Empty `{}` when none.
 */

type JsonRecord = Record<string, unknown>;

export type SiteSidebar =
  | Record<string, never>
  | {
      type: "Sidebar";
      props: JsonRecord;
    };

const isPlainObject = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function isEmptySidebar(
  value: SiteSidebar | null | undefined
): boolean {
  return !value || Object.keys(value).length === 0;
}

export function emptySidebar(): SiteSidebar {
  return {};
}

export function normalizeSiteSidebar(value: unknown): SiteSidebar {
  if (!isPlainObject(value) || Object.keys(value).length === 0) {
    return emptySidebar();
  }

  if (value.type !== "Sidebar" || !isPlainObject(value.props)) {
    return emptySidebar();
  }

  return {
    type: "Sidebar",
    props: { ...value.props },
  };
}

type ComponentLike = {
  type: string;
  props: JsonRecord;
};

/**
 * Convert a legacy `ZoneDrawer` zone node into a `Sidebar` block so mobile
 * no longer depends on the drawer zone.
 */
export function sidebarFromZoneDrawer(
  drawer: ComponentLike | null | undefined
): SiteSidebar {
  if (!drawer || drawer.type !== "ZoneDrawer" || !isPlainObject(drawer.props)) {
    return emptySidebar();
  }

  const side = drawer.props.side === "right" ? "right" : "left";
  const slot = Array.isArray(drawer.props.slot) ? drawer.props.slot : [];
  const id =
    typeof drawer.props.id === "string"
      ? drawer.props.id.replace(/^ZoneDrawer/, "Sidebar")
      : "Sidebar-site";

  return {
    type: "Sidebar",
    props: {
      id,
      title: { ar: "القائمة", en: "Menu" },
      showTitle: true,
      dock: side,
      dockOffsetTop: "56px",
      width: "medium",
      stickyTop: "",
      borderStyle: "none",
      backgroundColor: "surface",
      showOnMobile: "always",
      layout: { grow: false },
      items: slot,
    },
  };
}

export function toEditorSidebarNode(
  sidebar: SiteSidebar
): ComponentLike | null {
  if (isEmptySidebar(sidebar) || !("type" in sidebar)) return null;
  return {
    type: "Sidebar",
    props: { ...sidebar.props },
  };
}

export function toPersistedSidebar(
  node: ComponentLike | null | undefined
): SiteSidebar {
  if (!node || node.type !== "Sidebar" || !isPlainObject(node.props)) {
    return emptySidebar();
  }
  return {
    type: "Sidebar",
    props: { ...node.props },
  };
}
