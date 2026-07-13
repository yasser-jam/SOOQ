import type { Field } from "../../../../types";

/**
 * D-3: the properties sidebar groups a block's fields into three tabs —
 * المحتوى (what it says/shows) / التصميم (how it looks) / متقدم (rarely
 * touched). Blocks can pin a field explicitly via `metadata: { group }`;
 * otherwise the field NAME is classified below, defaulting to content.
 * One shared map instead of per-block wiring so all ~55 blocks get the
 * organized sidebar at once.
 */

export type FieldGroup = "content" | "style" | "advanced";

export const FIELD_GROUP_LABELS: Record<FieldGroup, string> = {
  content: "المحتوى",
  style: "التصميم",
  advanced: "متقدم",
};

export const FIELD_GROUP_ORDER: FieldGroup[] = [
  "content",
  "style",
  "advanced",
];

const STYLE_FIELD_NAMES = new Set([
  // surface
  "backgroundColor",
  "backgroundImage",
  "backgroundOverlayColor",
  "theme",
  "color",
  "textColor",
  "colorFixed",
  // box
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingHorizontal",
  "margin",
  "marginTop",
  "marginBottom",
  "borderRadius",
  "radius",
  "boxShadow",
  "borderStyle",
  "thickness",
  "size",
  "width",
  "height",
  "minHeight",
  "maxWidth",
  "aspectRatio",
  "objectFit",
  // layout
  "layout",
  "layoutStyle",
  "layoutVariant",
  "direction",
  "orientation",
  "gap",
  "gridGap",
  "gapX",
  "gapY",
  "columns",
  "columnsMobile",
  "numColumns",
  "maxRows",
  "alignItems",
  "justifyContent",
  "wrap",
  "align",
  "textAlign",
  "stickyTop",
  "showOnMobile",
  // typography-ish
  "fontSize",
  "fontWeight",
  "variant",
  // toggles that are about looks
  "showDividerLines",
  "showThumbnails",
  "showAvatars",
  "showRating",
  "showTitle",
  "submitWidth",
]);

const ADVANCED_FIELD_NAMES = new Set([
  "id",
  "anchorId",
  "visible",
  "metadata",
  "sectionKind",
  "cartLineId",
  "skipProductDetailFetch",
  "language",
  "activePath",
  "enableCaptcha",
  "showDataHints",
  "editMode",
]);

export function resolveFieldGroup(
  fieldName: string,
  field?: Pick<Field, "metadata"> | null
): FieldGroup {
  const explicit = (field?.metadata as { group?: unknown } | undefined)?.group;
  if (explicit === "content" || explicit === "style" || explicit === "advanced") {
    return explicit;
  }

  if (ADVANCED_FIELD_NAMES.has(fieldName)) return "advanced";
  if (STYLE_FIELD_NAMES.has(fieldName)) return "style";
  return "content";
}

export function groupFieldNames(
  fields: Record<string, Field | undefined>
): Record<FieldGroup, string[]> {
  const grouped: Record<FieldGroup, string[]> = {
    content: [],
    style: [],
    advanced: [],
  };

  for (const [name, field] of Object.entries(fields)) {
    if (!field || field.type === "slot") continue;
    grouped[resolveFieldGroup(name, field)].push(name);
  }

  return grouped;
}
