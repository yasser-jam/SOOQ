import type { Field } from "../../../../types";

/**
 * The properties sidebar groups a block's fields into six function tabs —
 * المحتوى (what it says/shows) / التخطيط (spacing, width, columns) /
 * الخلفية (background color/image/overlay) / الخط (typography) /
 * الحدود (border + shadow) / متقدم (rarely touched). Blocks can pin a field
 * explicitly via `metadata: { group }`; otherwise the field NAME is
 * classified below, defaulting to content. One shared map instead of
 * per-block wiring so all ~55 blocks get the organized sidebar at once.
 *
 * Tabs whose group has no fields for the selected block are hidden, so a
 * simple block may show only two or three tabs.
 */

export type FieldGroup =
  | "content"
  | "layout"
  | "background"
  | "typography"
  | "border"
  | "advanced";

export const FIELD_GROUP_LABELS: Record<FieldGroup, string> = {
  content: "المحتوى",
  layout: "التخطيط",
  background: "الخلفية",
  typography: "الخط",
  border: "الحدود",
  advanced: "متقدم",
};

export const FIELD_GROUP_ORDER: FieldGroup[] = [
  "content",
  "layout",
  "background",
  "typography",
  "border",
  "advanced",
];

/**
 * Fixed accent per tab — the same color family used by the blocks palette
 * avatars, so the two panels share one visual language.
 */
export const FIELD_GROUP_COLORS: Record<
  FieldGroup,
  { color: string; tint: string }
> = {
  content: { color: "#3563e9", tint: "#e8eefc" },
  layout: { color: "#0284c7", tint: "#eaf5fd" },
  background: { color: "#7c3aed", tint: "#f3eefe" },
  typography: { color: "#0d9488", tint: "#e7f7f4" },
  border: { color: "#be185d", tint: "#fdeef4" },
  advanced: { color: "#64748b", tint: "#eef1f6" },
};

const LAYOUT_FIELD_NAMES = new Set([
  // box spacing
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingHorizontal",
  "margin",
  "marginTop",
  "marginBottom",
  // sizing
  "size",
  "width",
  "height",
  "minHeight",
  "maxWidth",
  "aspectRatio",
  "objectFit",
  // arrangement
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
  "stickyTop",
  "showOnMobile",
  "submitWidth",
]);

const BACKGROUND_FIELD_NAMES = new Set([
  "backgroundColor",
  "backgroundImage",
  "backgroundOverlayColor",
  "variant",
]);

const TYPOGRAPHY_FIELD_NAMES = new Set([
  "align",
  "textAlign",
  "color",
  "textColor",
  "colorFixed",
  "colorMode",
  "colorTheme",
  // Section's "theme" radio is the light/dark text choice
  "theme",
  "fontSize",
  "fontWeight",
]);

const BORDER_FIELD_NAMES = new Set([
  "border",
  "borderRadius",
  "radius",
  "borderStyle",
  "borderWidth",
  "borderColor",
  "thickness",
  "boxShadow",
  // withLayout's border designer portal field
  "layoutBorder",
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
  if (
    explicit === "content" ||
    explicit === "layout" ||
    explicit === "background" ||
    explicit === "typography" ||
    explicit === "border" ||
    explicit === "advanced"
  ) {
    return explicit;
  }
  // Legacy alias from the 3-group era — style fields were mostly visual;
  // map them to background so old metadata keeps working.
  if (explicit === "style") return "background";

  if (ADVANCED_FIELD_NAMES.has(fieldName)) return "advanced";
  if (BORDER_FIELD_NAMES.has(fieldName)) return "border";
  if (TYPOGRAPHY_FIELD_NAMES.has(fieldName)) return "typography";
  if (BACKGROUND_FIELD_NAMES.has(fieldName)) return "background";
  if (LAYOUT_FIELD_NAMES.has(fieldName)) return "layout";
  return "content";
}

export function groupFieldNames(
  fields: Record<string, Field | undefined>
): Record<FieldGroup, string[]> {
  const grouped: Record<FieldGroup, string[]> = {
    content: [],
    layout: [],
    background: [],
    typography: [],
    border: [],
    advanced: [],
  };

  for (const [name, field] of Object.entries(fields)) {
    if (!field || field.type === "slot") continue;
    grouped[resolveFieldGroup(name, field)].push(name);
  }

  return grouped;
}
