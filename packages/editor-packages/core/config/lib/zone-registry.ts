import type { LucideIcon } from "lucide-react";
import {
  LayoutPanelTop,
  PanelBottom,
  PanelLeft,
  Square,
  RectangleHorizontal,
} from "lucide-react";
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
  blockType: string;
  title: string;
  description: string;
  icon: LucideIcon;
  isOverlay: boolean;
};

export const ZONE_DEFINITIONS: ZoneDefinition[] = [
  {
    id: "header",
    zoneKey: ZONE_HEADER,
    rootZone: ROOT_ZONE_HEADER,
    blockType: "SiteHeader",
    title: "رأس الموقع",
    description: "شريط العلامة التجارية والتنقل أعلى كل صفحة",
    icon: LayoutPanelTop,
    isOverlay: false,
  },
  {
    id: "footer",
    zoneKey: ZONE_FOOTER,
    rootZone: ROOT_ZONE_FOOTER,
    blockType: "SiteFooter",
    title: "تذييل الموقع",
    description: "أعمدة الروابط والشريط السفلي في نهاية الصفحة",
    icon: PanelBottom,
    isOverlay: false,
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
  },
];

export const getZoneDefinitionByRootZone = (rootZone: string) =>
  ZONE_DEFINITIONS.find((zone) => zone.rootZone === rootZone);

export const getZoneDefinitionByBlockType = (blockType: string) =>
  ZONE_DEFINITIONS.find((zone) => zone.blockType === blockType);
