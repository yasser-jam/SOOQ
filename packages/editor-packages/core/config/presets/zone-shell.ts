import type { ComponentDataOptionalId } from "@/core/types";
import { PRESET_FOOTER_BOTTOM_LINKS, PRESET_FOOTER_COLUMNS, PRESET_HEADER_LINKS } from "./shell-defaults";
import { createHeading, createParagraph, createSection } from "./shared";

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

export const HEADER_NAV_ITEMS = toNavMenuItems(PRESET_HEADER_LINKS);

export const CART_ICON_BUTTON = {
  type: "CartIconButton" as const,
  props: {
    href: "/cart",
    iconSize: 22,
    badgeColor: "#ef4444",
    badgeTextColor: "#ffffff",
  },
};

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

export function createHeaderNavMenu(
  variant: "plain" | "pill" | "button",
  overrides: Record<string, unknown> = {}
) {
  return {
    type: "NavMenu" as const,
    props: {
      orientation: "horizontal",
      variant,
      activePath: "/",
      items: HEADER_NAV_ITEMS,
      ...overrides,
    },
  };
}

export function createHeaderBrandTitle(title = "متجري") {
  return createHeading(title, {
    fontSize: "theme-xl",
    fontWeight: "theme-bold",
    textAlign: "right",
  });
}

export function createHeaderRowSection(
  props: Record<string, unknown>,
  rowContent: unknown[]
): ComponentDataOptionalId {
  return createSection({
    ...HEADER_SECTION_BASE,
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
