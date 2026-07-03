import type { ZonePreset } from "./types";
import { PRESET_HEADER_LINKS } from "./shell-defaults";
import { createHeading, createParagraph } from "./shared";

const navItems = PRESET_HEADER_LINKS.map((link) => ({
  label: { ar: link.labelAr ?? link.label, en: link.label },
  link: link.link ?? { kind: "none" as const },
}));

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
      key: "site-drawer",
      side: "left",
      backgroundColor: "#ffffff",
      overlay: true,
      showCloseButton: true,
      slot: [
        createHeading("القائمة", { textAlign: "right" }),
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

export const ZONE_DRAWER_PRESETS: ZonePreset[] = [drawerMobileNav];
