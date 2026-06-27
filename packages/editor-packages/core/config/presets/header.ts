import type { SectionPreset } from "./types";
import { PRESET_HEADER_LINKS } from "./shell-defaults";
import { createShellBlock } from "./shared";

const headerTransparentCentered: SectionPreset = {
  id: "header-transparent-centered",
  category: "header",
  title: "رأس شفاف — قائمة وسط",
  previewImage:
    "https://placehold.co/800x240/f8fafc/64748b?text=Transparent+Header",
  componentData: createShellBlock("SiteHeader", {
    title: "متجري",
    variant: "default",
    language: "ar",
    visible: true,
    brandHref: "/",
    links: [...PRESET_HEADER_LINKS],
    backgroundColor: "transparent",
    textColor: "#0f172a",
    layoutMode: "centered",
    menuAlign: "end",
    navStyle: "underline",
    showDrawerButton: true,
    drawerButtonIcon: "menu",
    drawerName: "site-drawer",
  }),
};

const headerSolidSplit: SectionPreset = {
  id: "header-solid-split",
  category: "header",
  title: "رأس ملون — شعار وقائمة",
  previewImage:
    "https://placehold.co/800x240/ffffff/64748b?text=Solid+Header",
  componentData: createShellBlock("SiteHeader", {
    title: "متجري",
    variant: "default",
    language: "ar",
    visible: true,
    brandHref: "/",
    links: [...PRESET_HEADER_LINKS],
    backgroundColor: "#ffffff",
    textColor: "#0f172a",
    layoutMode: "split",
    menuAlign: "end",
    navStyle: "pill",
    showDrawerButton: false,
    drawerButtonIcon: "menu",
    drawerName: "site-drawer",
  }),
};

export const HEADER_PRESETS: SectionPreset[] = [
  headerTransparentCentered,
  headerSolidSplit,
];
