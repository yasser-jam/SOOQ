import { AlignRight } from "lucide-react";
import type { Field } from "@/core/types";
import type { PropertyPlugin } from "./types";

export function contentPlugin(
  fields: Record<string, Field>
): PropertyPlugin {
  return {
    id: "content",
    group: "content",
    label: "المحتوى",
    icon: AlignRight,
    color: { color: "#3563e9", tint: "#e8eefc" },
    fields,
  };
}
