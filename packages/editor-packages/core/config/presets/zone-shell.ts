import type { ComponentDataOptionalId } from "@/core/types";
import { PRESET_FOOTER_BOTTOM_LINKS, PRESET_FOOTER_COLUMNS, PRESET_HEADER_LINKS } from "./shell-defaults";
import {
  createContentLink,
  createHeading,
  createParagraph,
  createSection,
} from "./shared";
import { buildZoneHeaderSectionProps } from "../blocks/Section/zone-section";

export const toNavMenuItems = (
  links: ReadonlyArray<{
    label: string;
    labelAr?: string;
    link?: { kind: string; pageId?: string; hash?: string };
  }>
) =>
  links.map((link) => ({
    label: { ar: link.labelAr ?? link.label, en: link.label },
    link: link.link ?? { kind: "none" as const },
  }));

export const HEADER_GROUP_DEFAULTS = {
  product: null,
  metadata: null,
  skipProductDetailFetch: false,
  language: "ar" as const,
  backgroundColor: "",
  padding: "0px",
  borderRadius: "theme-none",
  boxShadow: "none",
};

const HEADER_LINK_VARIANT_STYLES = {
  plain: {
    hoverEffect: "underline",
    hoverColor: "theme-text",
    color: "theme-text",
  },
  pill: {
    hoverEffect: "color",
    hoverColor: "theme-primary",
    color: "theme-text",
  },
} as const;

export function createHeaderNavLinksGroup(
  variant: "plain" | "pill" = "plain",
  overrides: Record<string, unknown> & {
    links?: ReadonlyArray<{
      label: string;
      labelAr?: string;
      link?: { kind: string; pageId?: string; hash?: string };
    }>;
    linkProps?: Record<string, unknown>;
  } = {}
) {
  const links = overrides.links ?? PRESET_HEADER_LINKS;
  const linkProps = {
    fontSize: "theme-sm",
    icon: "none",
    align: "right",
    ...HEADER_LINK_VARIANT_STYLES[variant],
    ...overrides.linkProps,
  };
  const { links: _links, linkProps: _linkProps, ...groupOverrides } = overrides;

  return {
    type: "Group" as const,
    props: {
      ...HEADER_GROUP_DEFAULTS,
      direction: "row",
      gap: variant === "pill" ? 12 : 20,
      alignItems: "center",
      justifyContent: "flex-end",
      wrap: "wrap",
      content: links.map((item) =>
        createContentLink(
          item.labelAr ?? item.label,
          (item.link ?? { kind: "none" }) as Record<string, unknown>,
          linkProps
        )
      ),
      ...groupOverrides,
    },
  };
}

/** @deprecated Use createHeaderNavLinksGroup — header presets now use ContentLink groups. */
export function createHeaderNavMenu(
  variant: "plain" | "pill" | "button",
  overrides: Record<string, unknown> = {}
) {
  const mappedVariant = variant === "button" ? "pill" : variant;
  return createHeaderNavLinksGroup(mappedVariant, overrides);
}

/**
 * Header cart entry — `ContentButton` linking to the Site JSON `/cart` page.
 * Prefer this over the legacy `CartIconButton` block; `showCartBadge` gives it
 * the same live item-count badge, updated on `store-cart` changes.
 */
export const CART_ICON_BUTTON = {
  type: "ContentButton" as const,
  props: {
    label: "السلة",
    align: "center",
    destinationType: "link",
    buttonAction: "link",
    link: { kind: "page", pageId: "/cart" },
    buttonVariantMode: "variant",
    buttonVariant: "secondary",
    buttonVariantSize: "sm",
    radius: "theme-md",
    bgColor: "theme-surface",
    textColor: "theme-text",
    buttonSize: "theme-sm",
    submitRedirectUrl: "",
    showCondition: "loggedIn",
    showCartBadge: true,
  },
};

/**
 * Link to the customer order history. `/orders` is a real apps/store route
 * rather than a Site JSON page, so it is seeded here instead of appearing in
 * the pages menu. Hidden for signed-out visitors by default.
 * Prefer this over the legacy `OrdersIconButton` block.
 */
export const ORDERS_ICON_BUTTON = {
  type: "ContentButton" as const,
  props: {
    label: "طلباتي",
    align: "center",
    destinationType: "link",
    buttonAction: "link",
    link: { kind: "page", pageId: "/orders" },
    buttonVariantMode: "variant",
    buttonVariant: "secondary",
    buttonVariantSize: "sm",
    radius: "theme-md",
    bgColor: "theme-surface",
    textColor: "theme-text",
    buttonSize: "theme-sm",
    submitRedirectUrl: "",
    showCondition: "loggedIn",
  },
};

/**
 * A ContentButton wired to toggle a zone, styled as a compact icon-only
 * trigger. Hides on desktop by default so it appears only on mobile.
 */
export function createBurgerButton(
  zoneKey = "site-drawer",
  overrides: Record<string, unknown> = {}
) {
  return {
    type: "ContentButton" as const,
    props: {
      label: "☰",
      align: "center",
      destinationType: "zone",
      buttonAction: "link",
      link: { kind: "none" },
      zoneKey,
      zoneAction: "toggle",
      buttonVariantMode: "variant",
      buttonVariant: "secondary",
      buttonVariantSize: "sm",
      radius: "theme-md",
      bgColor: "theme-surface",
      textColor: "theme-text",
      buttonSize: "theme-sm",
      submitRedirectUrl: "",
      layout: {
        positionMode: "static",
        hideOnMobile: false,
        hideOnTablet: false,
        hideOnDesktop: true,
      },
      ...overrides,
    },
  };
}

const HEADER_SECTION_BASE = {
  name: "رأس الموقع",
  anchorId: "",
  visible: true,
  paddingTop: "16px",
  paddingBottom: "16px",
  paddingHorizontal: "24px",
  maxWidth: "1280px",
  columns: 1,
  columnsMobile: 1,
  gridGap: "16px",
  theme: "dark" as const,
};

const FOOTER_SECTION_BASE = {
  name: "تذييل الموقع",
  anchorId: "",
  visible: true,
  paddingTop: "48px",
  paddingBottom: "24px",
  paddingHorizontal: "24px",
  maxWidth: "1280px",
  columns: 1,
  columnsMobile: 1,
  gridGap: "24px",
  theme: "light" as const,
};

export function createHeaderBrandTitle(title = "متجري") {
  return createHeading(title, {
    fontSize: "theme-xl",
    fontWeight: "theme-bold",
    textAlign: "right",
  });
}

export function createHeaderSlotGroup(
  content: unknown[],
  overrides: Record<string, unknown> = {}
) {
  return {
    type: "Group" as const,
    props: {
      ...HEADER_GROUP_DEFAULTS,
      direction: "row",
      gap: 12,
      alignItems: "center",
      justifyContent: "flex-start",
      wrap: "nowrap",
      content,
      ...overrides,
    },
  };
}

export function createHeaderRowSection(
  props: Record<string, unknown>,
  rowContent: unknown[]
): ComponentDataOptionalId {
  return createSection({
    ...buildZoneHeaderSectionProps(HEADER_SECTION_BASE),
    ...props,
    content: [
      {
        type: "RowGroup",
        props: {
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
          wrap: "nowrap",
          backgroundColor: "",
          padding: "0px",
          borderRadius: "theme-none",
          content: rowContent,
        },
      },
    ],
  });
}

export function createFooterColumnNav(
  titleAr: string,
  titleEn: string,
  links: ReadonlyArray<{
    label: string;
    labelAr?: string;
    link?: { kind: string; pageId?: string; hash?: string };
  }>
) {
  return {
    type: "Group" as const,
    props: {
      direction: "column",
      gap: 12,
      alignItems: "flex-start",
      justifyContent: "flex-start",
      wrap: "nowrap",
      backgroundColor: "",
      padding: "0px",
      borderRadius: "theme-none",
      boxShadow: "none",
      content: [
        createHeading(titleAr, {
          fontSize: "theme-md",
          fontWeight: "theme-semibold",
          color: "theme-surface",
        }),
        {
          type: "NavMenu",
          props: {
            orientation: "vertical",
            variant: "plain",
            activePath: "",
            items: toNavMenuItems(links),
          },
        },
      ],
    },
  };
}

export function createFooterSection(
  props: Record<string, unknown>,
  content: unknown[]
): ComponentDataOptionalId {
  return createSection({
    ...FOOTER_SECTION_BASE,
    ...props,
    content,
  });
}

export function createDefaultFooterColumns() {
  return PRESET_FOOTER_COLUMNS.map((column) =>
    createFooterColumnNav(
      column.titleAr ?? column.title,
      column.title,
      column.links
    )
  );
}

export const DEFAULT_FOOTER_TAGLINE = createParagraph(
  "متجرك الشامل للسلع المختارة بعناية.",
  { color: "theme-muted", textAlign: "right" }
);

export const DEFAULT_FOOTER_BOTTOM = createParagraph("© ٢٠٢٦ متجري", {
  fontSize: "theme-sm",
  color: "theme-muted",
  textAlign: "center",
});

export const DEFAULT_FOOTER_BOTTOM_LINKS_NAV = {
  type: "NavMenu" as const,
  props: {
    orientation: "horizontal",
    variant: "plain",
    activePath: "",
    items: toNavMenuItems(PRESET_FOOTER_BOTTOM_LINKS),
  },
};
