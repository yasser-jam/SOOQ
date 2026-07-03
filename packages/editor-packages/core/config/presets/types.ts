import type { ComponentDataOptionalId } from "@/core/types";

export type SectionPresetCategory =
  | "general"
  | "hero"
  | "products-grid"
  | "forms";

export type SectionPreset = {
  id: string;
  category: SectionPresetCategory;
  title: string;
  /** Placeholder preview image URL (shown in Add Section dialog) */
  previewImage?: string;
  /** Full component tree; ids are placeholders regenerated on insert */
  componentData: ComponentDataOptionalId;
};

export type ZonePresetCategory =
  | "zone-header"
  | "zone-footer"
  | "zone-drawer"
  | "zone-popup"
  | "zone-bottom-sheet";

export type ZonePreset = {
  id: string;
  category: ZonePresetCategory;
  title: string;
  previewImage?: string;
  /** Full zone block tree placed into SiteData.zones on apply */
  componentData: ComponentDataOptionalId;
};
