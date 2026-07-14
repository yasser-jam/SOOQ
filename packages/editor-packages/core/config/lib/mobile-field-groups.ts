import type { Field } from "@/core/types";
import { isMobileEditorMetadata } from "./editor-mode";

/** Field names surfaced prominently when editing in mobile mode. */
const MOBILE_EDITOR_FIELD_GROUPS: Record<string, string> = {
  is_mobile_only: "content",
  showOnMobile: "layout",
};

/**
 * Tag mobile-relevant shell fields with explicit sidebar groups so they
 * appear in the المحتوى / التخطيط tabs instead of default classification.
 */
export function applyMobileEditorFieldGroups<
  T extends Record<string, Field | undefined>
>(fields: T, metadata?: { editorMode?: string } | null): T {
  if (!isMobileEditorMetadata(metadata)) return fields;

  const next = { ...fields } as Record<string, Field | undefined>;

  for (const [name, group] of Object.entries(MOBILE_EDITOR_FIELD_GROUPS)) {
    const field = next[name];
    if (!field || typeof field !== "object") continue;
    next[name] = {
      ...field,
      metadata: { ...field.metadata, group },
    } as Field;
  }

  return next as T;
}
