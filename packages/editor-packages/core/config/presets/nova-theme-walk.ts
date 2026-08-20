import type { ComponentDataOptionalId } from "@/core/types";

/**
 * Nova (نوفا) styling walker — shared by the theme's page layers
 * (`orders-nova.ts`, future `checkout-nova.ts`).
 *
 * Structure, data bindings and actions come verbatim from the shared presets;
 * this only rewrites theme-owned visual props into Nova's dark-navy
 * electronics language (near-black sections `#0b0f1a`, elevated cards
 * `#141a2e`, no shadows — a dark background makes drop shadows invisible, so
 * nova relies on background contrast instead) and swaps user-facing strings
 * for their bilingual `{ ar, en }` form.
 */

export type BilingualMap = Record<string, { ar: string; en: string }>;

/** Near-black page background used by every Nova content section. */
export const SECTION_BG = "#0b0f1a";
/** Elevated navy card surface that sits on the page background. */
export const CARD_BG = "#141a2e";

function isMoneyValue(props: Record<string, unknown>): boolean {
  const context = props.valueContext as { format?: string } | undefined;
  return context?.format === "money";
}

function headingStyles(props: Record<string, unknown>) {
  const centered = props.textAlign === "center";
  props.level ??= centered ? "2" : "3";
  props.fontFamily = "option1";
  props.fontSize = centered ? "theme-xl" : "theme-lg";
  props.fontWeight = "theme-bold";
  props.lineHeight = "theme-tight";
  props.fontStyle = "normal";
  props.textTransform = "none";
  props.color = "theme-text";
  props.textAlign ??= "right";
}

function paragraphStyles(props: Record<string, unknown>) {
  const money = isMoneyValue(props);
  props.fontFamily = "body";
  props.fontSize = "theme-md";
  props.fontWeight = money ? "theme-bold" : "theme-light";
  props.lineHeight = "theme-normal";
  props.fontStyle = "normal";
  props.textTransform = "none";
  props.color = money ? "theme-primary" : "theme-neutral";
  props.textAlign ??= "right";
}

function linkStyles(props: Record<string, unknown>) {
  props.align ??= "right";
  props.color = "theme-primary";
  props.hoverEffect = "border";
  props.hoverColor = "theme-primary";
  props.fontSize = "theme-md";
  props.icon = "chevron-left";
  props.iconPosition = "end";
}

function buttonStyles(props: Record<string, unknown>) {
  const compact = props.buttonVariant === "secondary";
  props.align = "center";
  props.buttonVariantMode = "variant";
  props.buttonVariantSize = compact ? "sm" : "md";
  props.buttonSize = compact ? "theme-sm" : "theme-md";
  props.radius = "theme-md";
  props.bgColor = compact ? "theme-surface" : "theme-primary";
  props.textColor = "theme-text";
  props.submitRedirectUrl ??= "";
  props.link ??= { kind: "none" };
}

/**
 * Build a walker bound to one page's translation table. Unknown strings pass
 * through as `{ ar: text, en: text }` so nothing renders blank.
 */
export function createNovaThemeWalk(BILINGUAL: BilingualMap) {
  function bilingual(text: unknown): unknown {
    if (typeof text !== "string") return text;
    const trimmed = text.trim();
    if (!trimmed) return { ar: "", en: "" };
    return BILINGUAL[trimmed] ?? { ar: trimmed, en: trimmed };
  }

  return function themeWalk(
    node: unknown,
    path: string,
    depth = 0
  ): ComponentDataOptionalId | ComponentDataOptionalId[] | unknown {
    if (Array.isArray(node)) {
      return node.map((entry, index) =>
        themeWalk(entry, `${path}-${index}`, depth + 1)
      ) as ComponentDataOptionalId[];
    }

    if (!node || typeof node !== "object") return node;

    const record = node as ComponentDataOptionalId;
    if (!record.type || !record.props) return node;

    const type = record.type;
    const props: Record<string, unknown> = { ...record.props };

    if (!props.id) {
      props.id = `${type}-${path}`.replace(/[^a-zA-Z0-9-]/g, "-");
    }

    if (type === "Section") {
      props.visible ??= true;
      props.paddingHorizontal = "32px";
      props.backgroundColor = SECTION_BG;
      props.backgroundImage ??= "";
      props.backgroundOverlayColor ??= "";
      props.theme = "dark";
      props.columns ??= 1;
      props.columnsMobile ??= 1;
      props.gridGap = "24px";
    }

    if (type === "Group" && props.padding === "24px") {
      props.backgroundColor = CARD_BG;
      props.padding = "24px";
      props.borderRadius = "theme-md";
      props.boxShadow = "none";
      props.cartLineId = null;
      props.backgroundImage ??= "";
      props.backgroundOverlayColor ??= "";
      props.product ??= null;
      props.metadata ??= null;
      props.language ??= "ar";
    }

    if (type === "RowGroup") {
      props.gap ??= 16;
      props.alignItems ??= "center";
      props.justifyContent ??= "space-between";
      props.wrap ??= "wrap";
      props.backgroundColor ??= "";
      props.padding ??= "0px";
      props.borderRadius ??= "theme-none";
    }

    if (type === "Chip") {
      props.shape = "pill";
      props.size ??= "sm";
      props.gap ??= 6;
    }

    if (type === "ZonePopup") {
      props.is_active = false;
      props.borderRadius = "theme-md";
      props.backgroundColor = CARD_BG;
      props.maxWidth = "440px";
      props.overlay ??= true;
      props.showCloseButton ??= true;
    }

    for (const key of ["text", "label", "title", "placeholder", "helperText"]) {
      if (key in props) props[key] = bilingual(props[key]);
    }

    if (type === "ContentHeading") headingStyles(props);
    if (type === "ContentParagraph") paragraphStyles(props);
    if (type === "ContentLink") linkStyles(props);
    if (type === "ContentButton") buttonStyles(props);

    if (props.content != null) {
      props.content = themeWalk(props.content, `${path}-content`, depth + 1);
    }
    if (props.cardTemplate != null) {
      props.cardTemplate = themeWalk(
        props.cardTemplate,
        `${path}-cardTemplate`,
        depth + 1
      );
    }
    if (props.slot != null) {
      props.slot = themeWalk(props.slot, `${path}-slot`, depth + 1);
    }

    return { type, props } as ComponentDataOptionalId;
  };
}
