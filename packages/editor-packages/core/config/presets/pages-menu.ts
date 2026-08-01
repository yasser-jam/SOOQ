import type { ComponentDataOptionalId } from "@/core/types";
import { getAllPages, getEditPath, type PageDefinition } from "../pages";
import { createContentLink, createHeading } from "./shared";
import type { ZonePreset } from "./types";
import {
  createBurgerButton,
  createHeaderBrandTitle,
  createHeaderRowSection,
  createHeaderSlotGroup,
  CART_ICON_BUTTON,
  ORDERS_ICON_BUTTON,
  HEADER_GROUP_DEFAULTS,
} from "./zone-shell";

/** Marker prop on Group blocks managed by the Pages Menu preset. */
export const PAGES_MENU_MARKER = "_pagesMenuPreset" as const;

export type PagesMenuStyleVariant = "header-horizontal" | "drawer-vertical";

const HEADER_LINK_PROPS = {
  fontSize: "theme-sm",
  icon: "none",
  align: "right",
  hoverEffect: "underline",
  hoverColor: "theme-text",
  color: "theme-text",
} as const;

const DRAWER_LINK_PROPS = {
  fontSize: "theme-md",
  icon: "none",
  align: "right",
  hoverEffect: "color",
  hoverColor: "theme-primary",
  color: "theme-text",
} as const;

export function getPageLinkId(page: Pick<PageDefinition, "path" | "examplePath">) {
  return getEditPath(page);
}

export function buildPagesMenuContentLinks(
  pages: PageDefinition[],
  styleVariant: PagesMenuStyleVariant = "header-horizontal"
) {
  const linkProps =
    styleVariant === "drawer-vertical" ? DRAWER_LINK_PROPS : HEADER_LINK_PROPS;

  return pages.map((page) =>
    createContentLink(
      page.label,
      { kind: "page", pageId: getPageLinkId(page) },
      linkProps
    )
  );
}

export function createPagesMenuGroup(
  pages: PageDefinition[],
  overrides: {
    styleVariant?: PagesMenuStyleVariant;
    direction?: "row" | "column";
    gap?: number;
    alignItems?: string;
    justifyContent?: string;
    wrap?: "wrap" | "nowrap";
    layout?: Record<string, unknown>;
    linkProps?: Record<string, unknown>;
  } = {}
) {
  const styleVariant = overrides.styleVariant ?? "header-horizontal";
  const linkProps = {
    ...(styleVariant === "drawer-vertical" ? DRAWER_LINK_PROPS : HEADER_LINK_PROPS),
    ...overrides.linkProps,
  };

  const { styleVariant: _sv, linkProps: _lp, ...groupOverrides } = overrides;

  return {
    type: "Group" as const,
    props: {
      ...HEADER_GROUP_DEFAULTS,
      [PAGES_MENU_MARKER]: true,
      direction: overrides.direction ?? "row",
      gap: overrides.gap ?? (styleVariant === "drawer-vertical" ? 12 : 20),
      alignItems: overrides.alignItems ?? "center",
      justifyContent: overrides.justifyContent ?? "flex-start",
      wrap: overrides.wrap ?? "wrap",
      content: pages.map((page) =>
        createContentLink(
          page.label,
          { kind: "page", pageId: getPageLinkId(page) },
          linkProps
        )
      ),
      ...groupOverrides,
    },
  };
}

function buildPagesMenuHeaderSection(): ComponentDataOptionalId {
  const pages = getAllPages();
  const brand = createHeaderBrandTitle("متجري");
  const pagesMenu = createPagesMenuGroup(pages, {
    styleVariant: "header-horizontal",
    direction: "row",
    justifyContent: "flex-start",
  });

  return createHeaderRowSection(
    {
      backgroundColor: "#ffffff",
      theme: "dark",
    },
    [brand, pagesMenu]
  );
}

function buildResponsivePagesMenuHeaderSection(): ComponentDataOptionalId {
  const pages = getAllPages();
  const brand = createHeaderBrandTitle("متجري");
  const pagesMenu = createPagesMenuGroup(pages, {
    styleVariant: "header-horizontal",
    direction: "row",
    justifyContent: "flex-start",
    layout: { hideOnMobile: true, hideOnDesktop: false, hideOnTablet: false },
  });
  const burger = createBurgerButton("site-drawer");

  return createHeaderRowSection(
    {
      backgroundColor: "#ffffff",
      theme: "dark",
    },
    [
      brand,
      pagesMenu,
      createHeaderSlotGroup([ORDERS_ICON_BUTTON, CART_ICON_BUTTON, burger]),
    ]
  );
}

/** Header zone preset: one ContentLink per site page, independently editable. */
export function getPagesMenuHeaderPreset(): ZonePreset {
  return {
    id: "header-pages-menu",
    category: "zone-header",
    title: "قائمة صفحات الموقع",
    previewImage:
      "https://placehold.co/800x240/f0f9ff/0284c7?text=Pages+Menu+Header",
    headerLayout: "logo-right-links-left",
    componentData: buildPagesMenuHeaderSection(),
  };
}

/** Responsive header with pages menu (desktop) + burger for mobile drawer. */
export function getPagesMenuResponsiveHeaderPreset(): ZonePreset {
  return {
    id: "header-pages-menu-responsive",
    category: "zone-header",
    title: "قائمة صفحات — رأس متجاوب",
    previewImage:
      "https://placehold.co/800x240/f0f9ff/0284c7?text=Pages+Menu+Responsive",
    headerLayout: "logo-right-burger-left",
    componentData: buildResponsivePagesMenuHeaderSection(),
  };
}

/** Drawer zone preset: vertical ContentLinks synced from site pages. */
export function getPagesMenuDrawerPreset(): ZonePreset {
  const pages = getAllPages();

  return {
    id: "drawer-pages-menu",
    category: "zone-drawer",
    title: "درج جوال — قائمة صفحات",
    previewImage:
      "https://placehold.co/320x640/f8fafc/64748b?text=Pages+Menu+Drawer",
    componentData: {
      type: "ZoneDrawer",
      props: {
        is_active: true,
        is_mobile_only: true,
        zoneKey: "site-drawer",
        side: "left",
        backgroundColor: "#ffffff",
        overlay: true,
        showCloseButton: true,
        slot: [
          createHeading("القائمة", {
            textAlign: "right",
            fontSize: "theme-xl",
          }),
          createPagesMenuGroup(pages, {
            styleVariant: "drawer-vertical",
            direction: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            wrap: "nowrap",
          }),
        ],
      },
    },
  };
}
