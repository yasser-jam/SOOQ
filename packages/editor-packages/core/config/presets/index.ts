import { FOOTER_PRESETS } from "./footer";
import { GENERAL_PRESETS } from "./general";
import { HEADER_PRESETS } from "./header";
import { HERO_PRESETS } from "./hero";
import type { SectionPreset, SectionPresetCategory } from "./types";

export type { SectionPreset, SectionPresetCategory } from "./types";

export const PRESET_CATEGORY_LABELS: Record<SectionPresetCategory, string> = {
  general: "عام",
  hero: "هيرو",
  header: "رأس الصفحة",
  footer: "تذييل",
  "products-grid": "شبكة المنتجات",
};

export const PRESET_CATEGORY_ORDER: SectionPresetCategory[] = [
  "general",
  "hero",
  "header",
  "footer",
  "products-grid",
];

export const SECTION_PRESETS: SectionPreset[] = [
  ...GENERAL_PRESETS,
  ...HERO_PRESETS,
  ...HEADER_PRESETS,
  ...FOOTER_PRESETS,
];

export function getPresetsByCategory(
  category: SectionPresetCategory
): SectionPreset[] {
  return SECTION_PRESETS.filter((preset) => preset.category === category);
}

export { GENERAL_PRESETS, HERO_PRESETS, HEADER_PRESETS, FOOTER_PRESETS };
