import type { LucideIcon } from "lucide-react";
import {
  LayoutPanelTop,
  PanelBottom,
  PanelLeft,
  Square,
  RectangleHorizontal,
} from "lucide-react";
import type { ZonePresetCategory } from "../presets/types";
import {
  ROOT_ZONE_BOTTOM_SHEET,
  ROOT_ZONE_DRAWER,
  ROOT_ZONE_FOOTER,
  ROOT_ZONE_HEADER,
  ROOT_ZONE_POPUP,
  ZONE_BOTTOM_SHEET,
  ZONE_DRAWER,
  ZONE_FOOTER,
  ZONE_HEADER,
  ZONE_POPUP,
  type SiteZoneKey,
} from "../shell-zones";

export type ZoneDefinition = {
  id: string;
  zoneKey: SiteZoneKey;
  rootZone: string;
  /** Puck block type for overlay zones; `Section` for header/footer preset zones */
  blockType: string;
  title: string;
  description: string;
  icon: LucideIcon;
  isOverlay: boolean;
  /** Header/footer zones use Section presets instead of a single shell block */
  isPresetZone?: boolean;
  presetCategory?: ZonePresetCategory;
};

export const ZONE_DEFINITIONS: ZoneDefinition[] = [
  {
    id: "header",
    zoneKey: ZONE_HEADER,
    rootZone: ROOT_ZONE_HEADER,
    blockType: "Section",
    title: "رأس الموقع",
    description: "قسم علوي ثابت — اختر قالباً وعدّل المحتوى داخله",
    icon: LayoutPanelTop,
    isOverlay: false,
    isPresetZone: true,
    presetCategory: "zone-header",
  },
  {
    id: "footer",
    zoneKey: ZONE_FOOTER,
    rootZone: ROOT_ZONE_FOOTER,
    blockType: "Section",
    title: "تذييل الموقع",
    description: "قسم سفلي ثابت — اختر قالباً وعدّل المحتوى داخله",
    icon: PanelBottom,
    isOverlay: false,
    isPresetZone: true,
    presetCategory: "zone-footer",
  },
  {
    id: "drawer",
    zoneKey: ZONE_DRAWER,
    rootZone: ROOT_ZONE_DRAWER,
    blockType: "ZoneDrawer",
    title: "درج جانبي",
    description: "لوحة منزلقة من الجانب — للقوائم على الجوال",
    icon: PanelLeft,
    isOverlay: true,
    presetCategory: "zone-drawer",
  },
  {
    id: "popup",
    zoneKey: ZONE_POPUP,
    rootZone: ROOT_ZONE_POPUP,
    blockType: "ZonePopup",
    title: "نافذة منبثقة",
    description: "مربع حوار في منتصف الشاشة — تسجيل دخول، عروض",
    icon: Square,
    isOverlay: true,
    presetCategory: "zone-popup",
  },
  {
    id: "bottom-sheet",
    zoneKey: ZONE_BOTTOM_SHEET,
    rootZone: ROOT_ZONE_BOTTOM_SHEET,
    blockType: "ZoneBottomSheet",
    title: "ورقة سفلية",
    description: "لوحة ترتفع من الأسفل — مناسبة للجوال",
    icon: RectangleHorizontal,
    isOverlay: true,
    presetCategory: "zone-bottom-sheet",
  },
];

export const getZoneDefinitionByRootZone = (rootZone: string) =>
  ZONE_DEFINITIONS.find((zone) => zone.rootZone === rootZone);

export const getZoneDefinitionByBlockType = (blockType: string) =>
  ZONE_DEFINITIONS.find((zone) => zone.blockType === blockType);
