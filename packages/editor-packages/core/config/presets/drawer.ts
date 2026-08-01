import type { ZonePreset } from "./types";
import { PRESET_HEADER_LINKS } from "./shell-defaults";
import { createHeading, createParagraph, createPrimaryButton } from "./shared";

const navItems = PRESET_HEADER_LINKS.map((link) => ({
  label: { ar: link.labelAr ?? link.label, en: link.label },
  link: link.link ?? { kind: "none" as const },
}));

/**
 * Basic mobile navigation drawer: heading + nav links.
 * Paired with the "رأس متجاوب" header preset (logo-right-burger-left)
 * which contains a ContentButton(zoneKey:"site-drawer", zoneAction:"toggle").
 */
const drawerMobileNav: ZonePreset = {
  id: "drawer-mobile-nav",
  category: "zone-drawer",
  title: "درج جوال — قائمة تنقل",
  previewImage:
    "https://placehold.co/320x640/f8fafc/64748b?text=Mobile+Drawer",
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
        createHeading("القائمة", { textAlign: "right", fontSize: "theme-xl" }),
        {
          type: "NavMenu",
          props: {
            orientation: "vertical",
            variant: "plain",
            activePath: "/",
            items: navItems,
          },
        },
      ],
    },
  },
};

/**
 * Enhanced commerce sidebar: brand name, tagline, full nav, shop CTA.
 * Use together with the "رأس متجاوب" header preset for a complete mobile experience.
 */
const drawerMobileCommerce: ZonePreset = {
  id: "drawer-mobile-commerce",
  category: "zone-drawer",
  title: "درج جوال — تجاري",
  previewImage:
    "https://placehold.co/320x640/10213a/f8fafc?text=Commerce+Drawer",
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
        createHeading("متجري", {
          textAlign: "right",
          fontSize: "theme-2xl",
          fontWeight: "theme-bold",
        }),
        createParagraph("اكتشف أفضل المنتجات", {
          textAlign: "right",
          fontSize: "theme-sm",
          color: "theme-muted",
        }),
        {
          type: "NavMenu",
          props: {
            orientation: "vertical",
            variant: "plain",
            activePath: "/",
            items: navItems,
          },
        },
        createPrimaryButton("تسوق الآن", {
          destinationType: "link",
          link: { kind: "page", pageId: "/products/example-product" },
          buttonVariantSize: "md",
          align: "right",
        }),
      ],
    },
  },
};

export const ZONE_DRAWER_PRESETS: ZonePreset[] = [
  drawerMobileNav,
  drawerMobileCommerce,
];

/** Default drawer preset paired with the responsive commerce header. */
export const DEFAULT_ZONE_DRAWER_PRESET: ZonePreset = drawerMobileNav;
