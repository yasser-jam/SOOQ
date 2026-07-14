import type { LucideIcon } from "lucide-react";
import {
  AlignRight,
  LayoutPanelTop,
  Palette,
  Settings2,
  SquareDashed,
  Type,
} from "lucide-react";

/**
 * Canonical tab groups for the properties sidebar. Each property plugin
 * registers under one of these groups; the Fields panel reads plugin
 * metadata to render tabs instead of inferring groups from field names.
 */
export type PropertyPluginGroup =
  | "content"
  | "layout"
  | "background"
  | "typography"
  | "border"
  | "advanced";

export const PLUGIN_GROUP_LABELS: Record<PropertyPluginGroup, string> = {
  content: "المحتوى",
  layout: "التخطيط",
  background: "الخلفية",
  typography: "الخط",
  border: "الحدود",
  advanced: "متقدم",
};

export const PLUGIN_GROUP_ORDER: PropertyPluginGroup[] = [
  "content",
  "layout",
  "background",
  "typography",
  "border",
  "advanced",
];

export const PLUGIN_GROUP_COLORS: Record<
  PropertyPluginGroup,
  { color: string; tint: string }
> = {
  content: { color: "#3563e9", tint: "#e8eefc" },
  layout: { color: "#0284c7", tint: "#eaf5fd" },
  background: { color: "#7c3aed", tint: "#f3eefe" },
  typography: { color: "#0d9488", tint: "#e7f7f4" },
  border: { color: "#be185d", tint: "#fdeef4" },
  advanced: { color: "#64748b", tint: "#eef1f6" },
};

export const PLUGIN_GROUP_ICONS: Record<PropertyPluginGroup, LucideIcon> = {
  content: AlignRight,
  layout: LayoutPanelTop,
  background: Palette,
  typography: Type,
  border: SquareDashed,
  advanced: Settings2,
};
