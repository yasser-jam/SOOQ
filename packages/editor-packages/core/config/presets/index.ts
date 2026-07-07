import { CART_PRESETS } from "./cart";
import { FOOTER_PRESETS, ZONE_FOOTER_PRESETS } from "./footer";
import { FORMS_PRESETS } from "./forms";
import { GENERAL_PRESETS } from "./general";
import { HEADER_PRESETS, ZONE_HEADER_PRESETS } from "./header";
import { HERO_PRESETS } from "./hero";
import { PRODUCTS_GRID_PRESETS } from "./products-grid";
import { ZONE_DRAWER_PRESETS } from "./drawer";
import { ZONE_POPUP_PRESETS } from "./popup";
import { ZONE_BOTTOM_SHEET_PRESETS } from "./bottom-sheet";
import type { SectionPreset, SectionPresetCategory, ZonePreset, ZonePresetCategory } from "./types";

export type {
  SectionPreset,
  SectionPresetCategory,
  ZonePreset,
  ZonePresetCategory,
  HeaderPresetLayout,
} from "./types";

export const PRESET_CATEGORY_LABELS: Record<SectionPresetCategory, string> = {
  general: "عام",
  hero: "هيرو",
  "products-grid": "شبكة المنتجات",
  forms: "استبيانات",
  cart: "السلة",
};

export const PRESET_CATEGORY_ORDER: SectionPresetCategory[] = [
  "general",
  "hero",
  "products-grid",
  "forms",
  "cart",
];

export const ZONE_PRESET_CATEGORY_LABELS: Record<ZonePresetCategory, string> = {
  "zone-header": "رأس الموقع",
  "zone-footer": "تذييل الموقع",
  "zone-drawer": "درج جانبي",
  "zone-popup": "نافذة منبثقة",
  "zone-bottom-sheet": "ورقة سفلية",
};

export const ZONE_PRESET_CATEGORY_ORDER: ZonePresetCategory[] = [
  "zone-header",
  "zone-footer",
  "zone-drawer",
  "zone-popup",
  "zone-bottom-sheet",
];

export const SECTION_PRESETS: SectionPreset[] = [
  ...GENERAL_PRESETS,
  ...HERO_PRESETS,
  ...PRODUCTS_GRID_PRESETS,
  ...FORMS_PRESETS,
  ...CART_PRESETS,
];

export const ZONE_PRESETS: ZonePreset[] = [
  ...ZONE_HEADER_PRESETS,
  ...ZONE_FOOTER_PRESETS,
  ...ZONE_DRAWER_PRESETS,
  ...ZONE_POPUP_PRESETS,
  ...ZONE_BOTTOM_SHEET_PRESETS,
];

export function getPresetsByCategory(
  category: SectionPresetCategory
): SectionPreset[] {
  return SECTION_PRESETS.filter((preset) => preset.category === category);
}

export function getZonePresetsByCategory(
  category: ZonePresetCategory
): ZonePreset[] {
  return ZONE_PRESETS.filter((preset) => preset.category === category);
}

export function getHeaderPresetById(id: string): ZonePreset | undefined {
  return ZONE_HEADER_PRESETS.find((preset) => preset.id === id);
}

export { applyHeaderZonePreset } from "../lib/apply-zone-preset";

export {
  CART_PRESETS,
  FORMS_PRESETS,
  GENERAL_PRESETS,
  HERO_PRESETS,
  HEADER_PRESETS,
  FOOTER_PRESETS,
  ZONE_HEADER_PRESETS,
  ZONE_FOOTER_PRESETS,
  ZONE_DRAWER_PRESETS,
  ZONE_POPUP_PRESETS,
  ZONE_BOTTOM_SHEET_PRESETS,
  PRODUCTS_GRID_PRESETS,
};
export {
  createProductCardGroup,
  createProductCardBlock,
  createDemoProductCard,
  createProductsGridBlock,
  createProductsGridSection,
  createProductDetailSection,
} from "./products-grid";
export {
  createCartItemGroup,
  createCartSectionPreset,
  createCartPageContent,
} from "./cart";
