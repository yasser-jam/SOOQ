import type { ZonePreset } from "./types";
import { PRESET_HEADER_LINKS } from "./shell-defaults";
import { createShellBlock } from "./shared";

// ─── Shared right-slot items ──────────────────────────────────────────────────

const CART_ICON_BUTTON = {
  type: "CartIconButton" as const,
  props: {
    href: "/cart",
    iconSize: 22,
    badgeColor: "#ef4444",
    badgeTextColor: "#ffffff",
  },
};

const LOGIN_BUTTON = {
  type: "LoginButton" as const,
  props: {
    userNameCookie: "sooq-user-name",
    guestLabel: "تسجيل الدخول",
    showIcon: true,
    textColor: "inherit",
  },
};

// ─── Presets ──────────────────────────────────────────────────────────────────

const headerTransparentCentered: ZonePreset = {
  id: "header-transparent-centered",
  category: "zone-header",
  title: "رأس شفاف — قائمة وسط",
  previewImage:
    "https://placehold.co/800x240/f8fafc/64748b?text=Transparent+Header",
  componentData: createShellBlock("SiteHeader", {
    title: "متجري",
    variant: "default",
    language: "ar",
    visible: true,
    is_mobile_only: false,
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
    rightSlot: [],
  }),
};

const headerSolidSplit: ZonePreset = {
  id: "header-solid-split",
  category: "zone-header",
  title: "رأس ملون — شعار وقائمة",
  previewImage:
    "https://placehold.co/800x240/ffffff/64748b?text=Solid+Header",
  componentData: createShellBlock("SiteHeader", {
    title: "متجري",
    variant: "default",
    language: "ar",
    visible: true,
    is_mobile_only: false,
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
    rightSlot: [],
  }),
};

/** Commerce dark header with cart badge + login button in the right slot */
const headerCommerceWithActions: ZonePreset = {
  id: "header-commerce-actions",
  category: "zone-header",
  title: "رأس تجاري — سلة + دخول",
  previewImage:
    "https://placehold.co/800x240/10213a/ffffff?text=Commerce+Header",
  componentData: createShellBlock("SiteHeader", {
    title: "متجري",
    variant: "commerce",
    language: "ar",
    visible: true,
    is_mobile_only: false,
    brandHref: "/",
    links: [...PRESET_HEADER_LINKS],
    backgroundColor: "",
    textColor: "",
    layoutMode: "split",
    menuAlign: "end",
    navStyle: "pill",
    showDrawerButton: false,
    drawerButtonIcon: "menu",
    drawerName: "site-drawer",
    rightSlot: [CART_ICON_BUTTON, LOGIN_BUTTON],
  }),
};

/** Light split header with cart badge + login button */
const headerLightWithActions: ZonePreset = {
  id: "header-light-actions",
  category: "zone-header",
  title: "رأس فاتح — سلة + دخول",
  previewImage:
    "https://placehold.co/800x240/ffffff/0f172a?text=Light+Header",
  componentData: createShellBlock("SiteHeader", {
    title: "متجري",
    variant: "default",
    language: "ar",
    visible: true,
    is_mobile_only: false,
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
    rightSlot: [CART_ICON_BUTTON, LOGIN_BUTTON],
  }),
};

export const ZONE_HEADER_PRESETS: ZonePreset[] = [
  headerTransparentCentered,
  headerSolidSplit,
  headerCommerceWithActions,
  headerLightWithActions,
];

/** @deprecated Use ZONE_HEADER_PRESETS */
export const HEADER_PRESETS = ZONE_HEADER_PRESETS;
