import {
  TextSizeStep,
  FontWeightStep,
  LineHeightStep,
  RadiusStep,
  textSizeVar,
  fontWeightVar,
  lineHeightVar,
  radiusVar,
} from "../theme";

export const MODE_OPTIONS = [
  { label: "النسق", value: "theme" },
  { label: "مخصص", value: "fixed" },
] as const;

export const TEXT_SIZE_OPTIONS = (
  [
    ["xs", "صغير جداً"],
    ["sm", "صغير"],
    ["md", "متوسط"],
    ["lg", "كبير"],
    ["xl", "كبير جداً"],
    ["2xl", "ضخم"],
  ] as const
).map(([value, label]) => ({ label, value: value as TextSizeStep }));

export const RADIUS_OPTIONS = (
  [
    ["none", "بدون"],
    ["sm", "صغير"],
    ["md", "متوسط"],
    ["lg", "كبير"],
    ["xl", "كبير جداً"],
    ["full", "مستدير"],
  ] as const
).map(([value, label]) => ({ label, value: value as RadiusStep }));

export const FONT_WEIGHT_OPTIONS = (
  [
    ["light", "خفيف"],
    ["normal", "عادي"],
    ["medium", "متوسط"],
    ["semibold", "شبه غامق"],
    ["bold", "غامق"],
    ["bolder", "أكثر غمقاً"],
  ] as const
).map(([value, label]) => ({ label, value: value as FontWeightStep }));

export const LINE_HEIGHT_OPTIONS = (
  [
    ["tight", "ضيق"],
    ["normal", "عادي"],
    ["relaxed", "واسع"],
  ] as const
).map(([value, label]) => ({ label, value: value as LineHeightStep }));

function stripPrefix(value: string | undefined): string {
  if (!value) return "";
  return value.startsWith("theme-") ? value.slice(6) : value;
}

export function resolveFontSize(value: string | undefined, size?: TextSizeStep, fixed?: string): string {
  if (size === undefined) {
    const key = stripPrefix(value);
    if (value?.startsWith("theme-")) return textSizeVar(key as TextSizeStep);
    return key ? `${key}px` : "1rem";
  }
  return (value === "theme" ? textSizeVar(size) : fixed) || "1rem";
}

export function resolveFontWeight(value: string | undefined, step?: FontWeightStep, fixed?: string): string | number {
  if (step === undefined) {
    const key = stripPrefix(value);
    if (value?.startsWith("theme-")) return fontWeightVar(key as FontWeightStep);
    return key || 400;
  }
  return (value === "theme" ? fontWeightVar(step) : fixed) || 400;
}

export function resolveLineHeight(value: string | undefined, step?: LineHeightStep, fixed?: string): string {
  if (step === undefined) {
    const key = stripPrefix(value);
    if (value?.startsWith("theme-")) return lineHeightVar(key as LineHeightStep);
    return key || "1.5";
  }
  return (value === "theme" ? lineHeightVar(step) : fixed) || "1.5";
}

export function resolveRadius(value: string | undefined, step?: RadiusStep, fixed?: string): string {
  if (step === undefined) {
    const key = stripPrefix(value);
    if (value?.startsWith("theme-")) return radiusVar(key as RadiusStep);
    return key ? `${key}px` : "0";
  }
  return (value === "theme" ? radiusVar(step) : fixed) || "0";
}
