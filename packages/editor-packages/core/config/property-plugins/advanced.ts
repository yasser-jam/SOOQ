import { Settings2 } from "lucide-react";
import type { Field } from "@/core/types";
import {
  PLUGIN_GROUP_COLORS,
  PLUGIN_GROUP_LABELS,
} from "./registry";
import type { PropertyPlugin } from "./types";

/**
 * متقدم tab — anchor ids, visibility flags, binding hints, and other
 * rarely touched configuration.
 */
export function advancedPlugin(
  fields: Record<string, Field> = {}
): PropertyPlugin {
  return {
    id: "advanced",
    group: "advanced",
    label: PLUGIN_GROUP_LABELS.advanced,
    icon: Settings2,
    color: PLUGIN_GROUP_COLORS.advanced,
    fields,
  };
}
