import { Palette } from "lucide-react";
import type { Field } from "@/core/types";
import {
  PLUGIN_GROUP_COLORS,
  PLUGIN_GROUP_LABELS,
} from "./registry";
import type { PropertyPlugin } from "./types";

/**
 * الخلفية tab — background color, image, overlay, and related fields.
 */
export function backgroundPlugin(
  fields: Record<string, Field> = {}
): PropertyPlugin {
  return {
    id: "background",
    group: "background",
    label: PLUGIN_GROUP_LABELS.background,
    icon: Palette,
    color: PLUGIN_GROUP_COLORS.background,
    fields,
  };
}
