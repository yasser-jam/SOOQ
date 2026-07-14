import { Type } from "lucide-react";
import type { Field } from "@/core/types";
import {
  PLUGIN_GROUP_COLORS,
  PLUGIN_GROUP_LABELS,
} from "./registry";
import type { PropertyPlugin } from "./types";

/**
 * الخط tab — typography: alignment, color, font size/weight, etc.
 */
export function typographyPlugin(
  fields: Record<string, Field> = {}
): PropertyPlugin {
  return {
    id: "typography",
    group: "typography",
    label: PLUGIN_GROUP_LABELS.typography,
    icon: Type,
    color: PLUGIN_GROUP_COLORS.typography,
    fields,
  };
}
