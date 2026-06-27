import type { ComponentDataOptionalId } from "@/core/types";

export type SectionPresetCategory =
  | "general"
  | "hero"
  | "header"
  | "footer"
  | "products-grid";

export type SectionPreset = {
  id: string;
  category: SectionPresetCategory;
  title: string;
  /** Placeholder preview image URL (shown in Add Section dialog) */
  previewImage?: string;
  /** Full component tree; ids are placeholders regenerated on insert */
  componentData: ComponentDataOptionalId;
};
