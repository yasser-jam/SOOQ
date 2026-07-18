import type { CSSProperties, ReactNode } from "react";
import type { CustomField, DefaultComponentProps } from "@/core/types";

export type LayoutFieldProps = {
  /** @deprecated use paddingTop/paddingBottom; still read for migrated data */
  padding?: string;
  spanCol?: number;
  spanRow?: number;
  grow?: boolean;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  /** `static` (default) or out-of-flow (floating) placement */
  positionMode?: "static" | "float";
  /** When floating: `position: fixed` (viewport) vs `absolute` (containing block). */
  floatUseFixedPosition?: boolean;
  /** Custom %/auto insets vs named corner/edge anchors. */
  floatPlacementMode?: "custom" | "preset";
  /** One of eight anchors when `floatPlacementMode` is `preset`. */
  floatPreset?:
    | "top-left"
    | "top-middle"
    | "top-right"
    | "middle-left"
    | "middle-right"
    | "bottom-left"
    | "bottom-middle"
    | "bottom-right";
  /** Insets when `floatPlacementMode` is `custom`: `auto` or `0%`–`100%` (legacy `px` still applied). */
  fixedTop?: string;
  fixedRight?: string;
  fixedBottom?: string;
  fixedLeft?: string;
  /** Border width (e.g. `1px`). */
  borderWidth?: string;
  /** `none` hides the border regardless of width. */
  borderStyle?: "solid" | "dashed" | "none";
  borderColor?: string;
  /** Corner rounding (e.g. `10px`). Applied even when the border is hidden. */
  borderRadius?: string;
  shadowMode?: "none" | "preset" | "custom";
  shadowPreset?: "sm" | "md" | "lg" | "xl";
  shadowOffsetX?: string;
  shadowOffsetY?: string;
  shadowBlur?: string;
  shadowSpread?: string;
  shadowColor?: string;
  /** Root box `display` for the block wrapper. */
  displayMode?: "block" | "flex" | "grid";
  /** When true, block is hidden at that viewport width (theme breakpoints). */
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
};

export type LayoutVisibility = {
  showSpanCol?: boolean;
  showSpanRow?: boolean;
  showGrow?: boolean;
  maxSpanCol?: number;
  showPosition?: boolean;
  showBorder?: boolean;
  /** Per-viewport visibility toggles (mobile / tablet / desktop). */
  showVisibility?: boolean;
  /** Shadow preset controls in the appearance section. */
  showShadow?: boolean;
  /** Limit float anchor presets (e.g. corner-only for floating buttons). */
  floatPresetFilter?: FloatPresetKey[];
  /** When true, floating uses viewport `fixed` and hides the toggle. */
  floatViewportFixed?: boolean;
  /** Hide custom inset mode; preset anchors only. */
  hideFloatCustom?: boolean;
};

export type LayoutCustomField = CustomField<LayoutFieldProps> & LayoutVisibility;

export type WithLayout<Props extends DefaultComponentProps> = Props & {
  layout?: LayoutFieldProps;
};

export type LayoutProps = WithLayout<{
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** When true (Puck edit mode), responsive hiding is suppressed and viewport hints may show. */
  puckIsEditing?: boolean;
}>;

export const defaultLayoutValue: Required<
  Pick<
    LayoutFieldProps,
    | "spanCol"
    | "spanRow"
    | "grow"
    | "marginTop"
    | "marginRight"
    | "marginBottom"
    | "marginLeft"
    | "paddingTop"
    | "paddingRight"
    | "paddingBottom"
    | "paddingLeft"
    | "padding"
    | "positionMode"
    | "floatUseFixedPosition"
    | "floatPlacementMode"
    | "floatPreset"
    | "fixedTop"
    | "fixedRight"
    | "fixedBottom"
    | "fixedLeft"
    | "borderWidth"
    | "borderStyle"
    | "borderColor"
    | "borderRadius"
    | "shadowMode"
    | "shadowPreset"
    | "shadowOffsetX"
    | "shadowOffsetY"
    | "shadowBlur"
    | "shadowSpread"
    | "shadowColor"
    | "displayMode"
    | "hideOnMobile"
    | "hideOnTablet"
    | "hideOnDesktop"
  >
> = {
  spanCol: 1,
  spanRow: 1,
  grow: false,
  marginTop: "0px",
  marginRight: "0px",
  marginBottom: "0px",
  marginLeft: "0px",
  paddingTop: "0px",
  paddingRight: "0px",
  paddingBottom: "0px",
  paddingLeft: "0px",
  padding: "0px",
  positionMode: "static",
  floatUseFixedPosition: true,
  floatPlacementMode: "preset",
  floatPreset: "top-left",
  fixedTop: "auto",
  fixedRight: "auto",
  fixedBottom: "auto",
  fixedLeft: "auto",
  borderWidth: "0px",
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: "0px",
  shadowMode: "none",
  shadowPreset: "md",
  shadowOffsetX: "0px",
  shadowOffsetY: "4px",
  shadowBlur: "6px",
  shadowSpread: "0px",
  shadowColor: "rgba(0, 0, 0, 0.12)",
  displayMode: "block",
  hideOnMobile: false,
  hideOnTablet: false,
  hideOnDesktop: false,
};

export function normalizeLayout(value?: LayoutFieldProps): Required<LayoutFieldProps> {
  const merged: Required<LayoutFieldProps> = {
    ...defaultLayoutValue,
    ...value,
  };
  if (
    merged.positionMode === "float" &&
    value?.floatPlacementMode == null &&
    value?.floatPreset == null
  ) {
    merged.floatPlacementMode = "custom";
  }
  if (merged.positionMode === "float" && value?.floatUseFixedPosition === undefined) {
    merged.floatUseFixedPosition = true;
  }
  return merged;
}

export type ShadowPresetKey = NonNullable<LayoutFieldProps["shadowPreset"]>;

export const SHADOW_PRESET_CSS: Record<ShadowPresetKey, string> = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
};

export function resolveLayoutAppearanceStyles(
  layout: Required<LayoutFieldProps>
): CSSProperties {
  const appearance: CSSProperties = {
    boxSizing: "border-box",
  };

  if (layout.borderStyle === "none") {
    appearance.borderStyle = "none";
    appearance.borderWidth = 0;
  } else {
    appearance.borderWidth = layout.borderWidth;
    appearance.borderStyle = layout.borderStyle;
    appearance.borderColor = layout.borderColor;
  }

  if (layout.borderRadius && layout.borderRadius !== "0px") {
    appearance.borderRadius = layout.borderRadius;
  }

  if (layout.shadowMode === "none") {
    appearance.boxShadow = "none";
  } else if (layout.shadowMode === "preset") {
    const key = layout.shadowPreset ?? "md";
    appearance.boxShadow = SHADOW_PRESET_CSS[key] ?? SHADOW_PRESET_CSS.md;
  } else {
    appearance.boxShadow = `${layout.shadowOffsetX} ${layout.shadowOffsetY} ${layout.shadowBlur} ${layout.shadowSpread} ${layout.shadowColor}`;
  }

  return appearance;
}

/** Inset for custom float mode: omit when auto. */
export function insetCssValue(raw: string | undefined): string | undefined {
  if (raw == null) return undefined;
  const t = String(raw).trim().toLowerCase();
  if (t === "" || t === "auto") return undefined;
  return String(raw).trim();
}

export const PERCENT_INSET_OPTIONS: string[] = [
  "auto",
  ...Array.from({ length: 21 }, (_, i) => `${i * 5}%`),
];

export type FloatPresetKey = NonNullable<LayoutFieldProps["floatPreset"]>;

export function getFloatInsetStyleFromPreset(preset: FloatPresetKey): CSSProperties {
  const a = "auto" as const;
  switch (preset) {
    case "top-left":
      return { top: 0, left: 0, right: a, bottom: a };
    case "top-middle":
      return {
        top: 0,
        left: "50%",
        right: a,
        bottom: a,
        transform: "translateX(-50%)",
      };
    case "top-right":
      return { top: 0, right: 0, left: a, bottom: a };
    case "middle-left":
      return {
        top: "50%",
        left: 0,
        right: a,
        bottom: a,
        transform: "translateY(-50%)",
      };
    case "middle-right":
      return {
        top: "50%",
        right: 0,
        left: a,
        bottom: a,
        transform: "translateY(-50%)",
      };
    case "bottom-left":
      return { bottom: 0, left: 0, right: a, top: a };
    case "bottom-middle":
      return {
        bottom: 0,
        left: "50%",
        right: a,
        top: a,
        transform: "translateX(-50%)",
      };
    case "bottom-right":
      return { bottom: 0, right: 0, left: a, top: a };
    default:
      return { top: 0, left: 0 };
  }
}

export const FLOAT_PRESET_OPTIONS: { label: string; value: FloatPresetKey }[] = [
  { label: "أعلى يسار", value: "top-left" },
  { label: "أعلى وسط", value: "top-middle" },
  { label: "أعلى يمين", value: "top-right" },
  { label: "وسط يسار", value: "middle-left" },
  { label: "وسط يمين", value: "middle-right" },
  { label: "أسفل يسار", value: "bottom-left" },
  { label: "أسفل وسط", value: "bottom-middle" },
  { label: "أسفل يمين", value: "bottom-right" },
];

export const FLOAT_CORNER_PRESET_OPTIONS = FLOAT_PRESET_OPTIONS.filter((o) =>
  (["top-left", "top-right", "bottom-left", "bottom-right"] as FloatPresetKey[]).includes(
    o.value
  )
);

export type EdgeKey =
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft";

export function parsePx(raw: string | undefined): number {
  if (raw == null || raw === "") return 0;
  const m = String(raw).match(/^(\d+)/);
  return m ? parseInt(m[1]!, 10) : 0;
}

export function toPx(n: number): string {
  const v = Math.min(999, Math.max(0, Math.round(Number.isFinite(n) ? n : 0)));
  return `${v}px`;
}

/** Read stored shadow distances like `-4px` or `12` as integer pixels. */
export function parseShadowPx(raw: string | undefined): number {
  if (raw == null || raw === "") return 0;
  const m = String(raw).trim().match(/^(-?\d+)/);
  return m ? parseInt(m[1]!, 10) : 0;
}

export function clampShadowPx(n: number, min: number, max: number): number {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  return Math.min(max, Math.max(min, v));
}

export const SHADOW_NUMBER_FIELDS = [
  { key: "shadowOffsetX" as const, label: "X", min: -999, max: 999 },
  { key: "shadowOffsetY" as const, label: "Y", min: -999, max: 999 },
  { key: "shadowBlur" as const, label: "Blur", min: 0, max: 999 },
  { key: "shadowSpread" as const, label: "Spread", min: -999, max: 999 },
];

export function resolvePaddingTop(layout: LayoutFieldProps | undefined): string | undefined {
  if (!layout) return undefined;
  if (layout.paddingTop !== undefined) return layout.paddingTop;
  if (layout.padding !== undefined) return layout.padding;
  return undefined;
}

export function resolvePaddingBottom(layout: LayoutFieldProps | undefined): string | undefined {
  if (!layout) return undefined;
  if (layout.paddingBottom !== undefined) return layout.paddingBottom;
  if (layout.padding !== undefined) return layout.padding;
  return undefined;
}
