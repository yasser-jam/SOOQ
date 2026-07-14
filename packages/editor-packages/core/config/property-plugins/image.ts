import { ImageIcon } from "lucide-react";
import type { Field } from "@/core/types";
import {
  PLUGIN_GROUP_COLORS,
  PLUGIN_GROUP_LABELS,
} from "./registry";
import type { PropertyPlugin } from "./types";

/**
 * Image-specific المحتوى tab — replaces the generic contentPlugin for
 * blocks whose primary concern is image display (src, alt, object-fit, …).
 * Registers under the `content` group so it occupies the first tab slot.
 */
export function imagePlugin(
  fields: Record<string, Field>
): PropertyPlugin {
  return {
    id: "image",
    group: "content",
    label: PLUGIN_GROUP_LABELS.content,
    icon: ImageIcon,
    color: PLUGIN_GROUP_COLORS.content,
    fields,
  };
}
