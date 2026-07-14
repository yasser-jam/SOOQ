import { SquareDashed } from "lucide-react";
import type { Field } from "@/core/types";
import { borderDesignField } from "../fields/BorderField";
import {
  PLUGIN_GROUP_COLORS,
  PLUGIN_GROUP_LABELS,
} from "./registry";
import type { PropertyPlugin } from "./types";

/**
 * الحدود tab — visual border designer that portals into the shared
 * `layout` prop (`layoutBorder` field is never persisted).
 */
export function borderPlugin(): PropertyPlugin {
  return {
    id: "border",
    group: "border",
    label: PLUGIN_GROUP_LABELS.border,
    icon: SquareDashed,
    color: PLUGIN_GROUP_COLORS.border,
    resolveFields: (fields) => ({
      ...fields,
      layoutBorder: borderDesignField as Field,
    }),
  };
}
