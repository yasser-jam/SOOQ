import type { ZonePreset } from "./types";
import { createSection } from "./shared";
import {
  CART_ICON_BUTTON,
  createHeaderBrandTitle,
  createHeaderNavMenu,
  createHeaderRowSection,
} from "./zone-shell";

const headerTransparentCentered: ZonePreset = {
  id: "header-transparent-centered",
  category: "zone-header",
  title: "رأس شفاف — قائمة وسط",
  previewImage:
    "https://placehold.co/800x240/f8fafc/64748b?text=Transparent+Header",
  componentData: createSection({
    name: "رأس الموقع",
    visible: true,
    paddingTop: "16px",
    paddingBottom: "16px",
    paddingHorizontal: "24px",
    backgroundColor: "transparent",
    theme: "dark",
    maxWidth: "1280px",
    content: [
      createHeaderBrandTitle("متجري"),
      createHeaderNavMenu("plain", { activePath: "/" }),
    ],
  }),
};

const headerSolidSplit: ZonePreset = {
  id: "header-solid-split",
  category: "zone-header",
  title: "رأس ملون — شعار وقائمة",
  previewImage:
    "https://placehold.co/800x240/ffffff/64748b?text=Solid+Header",
  componentData: createHeaderRowSection(
    {
      backgroundColor: "#ffffff",
      theme: "dark",
    },
    [
      createHeaderBrandTitle("متجري"),
      createHeaderNavMenu("pill"),
    ]
  ),
};

const headerCommerceWithActions: ZonePreset = {
  id: "header-commerce-actions",
  category: "zone-header",
  title: "رأس تجاري — سلة",
  previewImage:
    "https://placehold.co/800x240/10213a/ffffff?text=Commerce+Header",
  componentData: createHeaderRowSection(
    {
      backgroundColor: "#10213a",
      theme: "light",
    },
    [
      createHeaderBrandTitle("متجري"),
      createHeaderNavMenu("pill", { activePath: "/" }),
      {
        type: "Group",
        props: {
          direction: "row",
          gap: 12,
          alignItems: "center",
          justifyContent: "flex-end",
          wrap: "nowrap",
          backgroundColor: "",
          padding: "0px",
          borderRadius: "theme-none",
          boxShadow: "none",
          content: [CART_ICON_BUTTON],
        },
      },
    ]
  ),
};

const headerLightWithActions: ZonePreset = {
  id: "header-light-actions",
  category: "zone-header",
  title: "رأس فاتح — سلة",
  previewImage:
    "https://placehold.co/800x240/ffffff/0f172a?text=Light+Header",
  componentData: createHeaderRowSection(
    {
      backgroundColor: "#ffffff",
      theme: "dark",
    },
    [
      createHeaderBrandTitle("متجري"),
      createHeaderNavMenu("pill"),
      {
        type: "Group",
        props: {
          direction: "row",
          gap: 12,
          alignItems: "center",
          justifyContent: "flex-end",
          wrap: "nowrap",
          backgroundColor: "",
          padding: "0px",
          borderRadius: "theme-none",
          boxShadow: "none",
          content: [CART_ICON_BUTTON],
        },
      },
    ]
  ),
};

export const ZONE_HEADER_PRESETS: ZonePreset[] = [
  headerTransparentCentered,
  headerSolidSplit,
  headerCommerceWithActions,
  headerLightWithActions,
];

export const DEFAULT_ZONE_HEADER_PRESET = headerSolidSplit;

/** @deprecated Use ZONE_HEADER_PRESETS */
export const HEADER_PRESETS = ZONE_HEADER_PRESETS;
