import type { ZonePreset } from "./types";
import {
  PRESET_FOOTER_BOTTOM_LINKS,
  PRESET_FOOTER_COLUMNS,
} from "./shell-defaults";
import { createShellBlock } from "./shared";

const footerCommerceFull: ZonePreset = {
  id: "footer-commerce-full",
  category: "zone-footer",
  title: "تذييل تجاري — أعمدة كاملة",
  previewImage:
    "https://placehold.co/800x320/10213a/f8fafc?text=Commerce+Footer",
  componentData: createShellBlock("SiteFooter", {
    title: "متجري",
    variant: "commerce",
    language: "ar",
    visible: true,
    is_mobile_only: false,
    tagline: "Your one-stop shop for curated goods.",
    taglineAr: "متجرك الشامل للسلع المختارة بعناية.",
    showBottomBar: true,
    bottomBarText: "© 2026 Meridian",
    bottomBarTextAr: "© ٢٠٢٦ متجري",
    columns: [...PRESET_FOOTER_COLUMNS],
    bottomLinks: [...PRESET_FOOTER_BOTTOM_LINKS],
    backgroundColor: "",
    textColor: "",
  }),
};

const footerDefaultClassic: ZonePreset = {
  id: "footer-default-classic",
  category: "zone-footer",
  title: "تذييل كلاسيكي — أعمدة",
  previewImage:
    "https://placehold.co/800x320/f8fafc/64748b?text=Classic+Footer",
  componentData: createShellBlock("SiteFooter", {
    title: "متجري",
    variant: "default",
    language: "ar",
    visible: true,
    is_mobile_only: false,
    tagline: "Quality products, delivered with care.",
    taglineAr: "منتجات عالية الجودة تُسلَّم بعناية.",
    showBottomBar: true,
    bottomBarText: "© 2026 Meridian",
    bottomBarTextAr: "© ٢٠٢٦ متجري",
    columns: [...PRESET_FOOTER_COLUMNS.slice(0, 2)],
    bottomLinks: [...PRESET_FOOTER_BOTTOM_LINKS],
    backgroundColor: "",
    textColor: "",
  }),
};

const footerCommerceMinimal: ZonePreset = {
  id: "footer-commerce-minimal",
  category: "zone-footer",
  title: "تذييل تجاري — مبسّط",
  previewImage:
    "https://placehold.co/800x240/1f2937/f8fafc?text=Minimal+Footer",
  componentData: createShellBlock("SiteFooter", {
    title: "متجري",
    variant: "commerce",
    language: "ar",
    visible: true,
    is_mobile_only: false,
    tagline: "Simple footer with brand and two link columns.",
    taglineAr: "تذييل بسيط مع العلامة وعمودين للروابط.",
    showBottomBar: false,
    bottomBarText: "",
    bottomBarTextAr: "",
    columns: [...PRESET_FOOTER_COLUMNS.slice(0, 2)],
    bottomLinks: [...PRESET_FOOTER_BOTTOM_LINKS.slice(0, 1)],
    backgroundColor: "#10213a",
    textColor: "#ffffff",
  }),
};

export const ZONE_FOOTER_PRESETS: ZonePreset[] = [
  footerCommerceFull,
  footerDefaultClassic,
  footerCommerceMinimal,
];

/** @deprecated Use ZONE_FOOTER_PRESETS */
export const FOOTER_PRESETS = ZONE_FOOTER_PRESETS;
