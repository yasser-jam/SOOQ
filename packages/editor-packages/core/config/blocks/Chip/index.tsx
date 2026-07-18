"use client";

import React, { CSSProperties, useMemo } from "react";
import { ComponentConfig, Fields } from "@/core/types";
import { WithLayout, withLayout } from "../../components/Layout";
import { RADIUS_OPTIONS, resolveRadius } from "../../content/typography-fields";
import { resolveColor, colorField } from "../../content/color-fields";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import type { ValueContext } from "../../binding";
import { resolveValueContext, useBoundData } from "../../binding";

export type ChipVariant =
  | "primary"
  | "secondary"
  | "neutral"
  | "success"
  | "warning"
  | "danger";

export type ChipProps = WithLayout<{
  chipVariantMode: "theme" | "custom";
  chipVariant: ChipVariant;
  shape: "pill" | "rounded" | "square";
  size: "sm" | "md" | "lg";
  gap: number;
  maxItems: number;
  bgColor: string;
  textColor: string;
  radius: string;
  listValueContext?: ValueContext | null;
}>;

type ChipItem = {
  id: string;
  name: string;
};

const CHIP_SIZE_STYLES: Record<
  ChipProps["size"],
  Pick<CSSProperties, "padding" | "fontSize">
> = {
  sm: { padding: "4px 8px", fontSize: 11 },
  md: { padding: "6px 10px", fontSize: 12 },
  lg: { padding: "8px 14px", fontSize: 14 },
};

const CHIP_SHAPE_RADIUS: Record<ChipProps["shape"], number | string> = {
  pill: 999,
  rounded: 8,
  square: 2,
};

function getChipVariantColors(variant: ChipVariant): {
  bg: string;
  fg: string;
  border: string;
} {
  const map: Record<
    ChipVariant,
    { bg: string; fg: string; border: string }
  > = {
    primary: {
      bg: "var(--theme-primary-muted, #eff6ff)",
      fg: "var(--theme-primary, #3b82f6)",
      border: "var(--theme-primary, #3b82f6)",
    },
    secondary: {
      bg: "var(--theme-secondary-muted, #f1f5f9)",
      fg: "var(--theme-secondary, #64748b)",
      border: "var(--theme-secondary, #64748b)",
    },
    neutral: {
      bg: "var(--theme-surface, #fff)",
      fg: "var(--theme-text, #0f172a)",
      border: "var(--theme-border, #e2e8f0)",
    },
    success: {
      bg: "var(--theme-success-muted, #dcfce7)",
      fg: "var(--theme-success, #16a34a)",
      border: "var(--theme-success, #16a34a)",
    },
    warning: {
      bg: "var(--theme-warning-muted, #fef3c7)",
      fg: "var(--theme-warning, #d97706)",
      border: "var(--theme-warning, #d97706)",
    },
    danger: {
      bg: "var(--theme-error-muted, #fee2e2)",
      fg: "var(--theme-error, #dc2626)",
      border: "var(--theme-error, #dc2626)",
    },
  };

  return map[variant] ?? map.neutral;
}

function parseChipList(value: unknown): ChipItem[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const items = value
    .map((entry) => {
      if (entry == null || typeof entry !== "object") return null;

      const record = entry as Record<string, unknown>;
      const id = String(record.id ?? "").trim();
      const name = String(record.name ?? "").trim();
      if (!id && !name) return null;

      return { id: id || name, name: name || id };
    })
    .filter((item): item is ChipItem => item != null);

  return items.length > 0 ? items : null;
}

function resolveChipStyle(props: ChipProps): CSSProperties {
  const sizeStyle = CHIP_SIZE_STYLES[props.size ?? "sm"];
  const borderRadius =
    props.chipVariantMode === "custom"
      ? resolveRadius(props.radius ?? "theme-md")
      : CHIP_SHAPE_RADIUS[props.shape ?? "pill"];

  if (props.chipVariantMode === "custom") {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius,
      background: resolveColor(props.bgColor ?? "theme-neutral"),
      color: resolveColor(props.textColor ?? "theme-text"),
      border: "1px solid transparent",
      fontWeight: 500,
      lineHeight: 1.2,
      whiteSpace: "nowrap",
      ...sizeStyle,
    };
  }

  const colors = getChipVariantColors(props.chipVariant ?? "neutral");

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius,
    background: colors.bg,
    color: colors.fg,
    border: `1px solid ${colors.border}`,
    fontWeight: 500,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    ...sizeStyle,
  };
}

const ChipInner: ComponentConfig<ChipProps> = {
  label: "شريحة",
  fields: {
    chipVariantMode: {
      type: "radio",
      label: "نمط الشريحة",
      options: [
        { label: "استخدام نمط", value: "theme" },
        { label: "تخصيص يدوي", value: "custom" },
      ],
    },
    chipVariant: {
      type: "select",
      label: "النمط",
      options: [
        { label: "أساسي", value: "primary" },
        { label: "ثانوي", value: "secondary" },
        { label: "محايد", value: "neutral" },
        { label: "نجاح", value: "success" },
        { label: "تحذير", value: "warning" },
        { label: "خطر", value: "danger" },
      ],
    },
    shape: {
      type: "radio",
      label: "الشكل",
      options: [
        { label: "حبة", value: "pill" },
        { label: "مستدير", value: "rounded" },
        { label: "مربع", value: "square" },
      ],
    },
    size: {
      type: "radio",
      label: "الحجم",
      options: [
        { label: "صغير", value: "sm" },
        { label: "متوسط", value: "md" },
        { label: "كبير", value: "lg" },
      ],
    },
    gap: { type: "number", label: "المسافة بين الشرائح", min: 0 },
    maxItems: { type: "number", label: "الحد الأقصى", min: 1 },
    radius: themeFixedSelectField({
      label: "زاوية الحدود",
      themeOptions: RADIUS_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
    bgColor: { ...colorField, label: "لون الخلفية" },
    textColor: { ...colorField, label: "لون النص" },
  },
  defaultProps: {
    chipVariantMode: "theme",
    chipVariant: "neutral",
    shape: "pill",
    size: "sm",
    gap: 6,
    maxItems: 10,
    radius: "theme-md",
    bgColor: "theme-neutral",
    textColor: "theme-text",
    layout: { grow: true },
  },
  render: (props) => {
    const { listValueContext, gap, maxItems } = props;
    const { data, language } = useBoundData();

    const items = useMemo(() => {
      if (!listValueContext?.path?.trim()) return null;

      const resolved = resolveValueContext(listValueContext.path, data, {
        locale: language,
      });

      return parseChipList(resolved);
    }, [data, language, listValueContext?.path]);

    if (!items) return null;

    const limit = Math.max(1, maxItems ?? 10);
    const visibleItems = items.slice(0, limit);
    const chipStyle = resolveChipStyle(props);

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: gap ?? 6,
          width: "100%",
          minWidth: 0,
        }}
      >
        {visibleItems.map((item) => (
          <span key={item.id} style={chipStyle}>
            {item.name}
          </span>
        ))}
      </div>
    );
  },
};

const WithLayoutChip = withLayout(ChipInner);

const FIELD_ORDER = [
  "chipVariantMode",
  "chipVariant",
  "shape",
  "size",
  "gap",
  "maxItems",
  "radius",
  "bgColor",
  "textColor",
  "layout",
] as const;

function resolveChipFields(
  fields: Record<string, unknown>,
  data: { props?: Partial<ChipProps> }
): Fields<ChipProps> {
  const variantMode = data.props?.chipVariantMode ?? "theme";
  const styleFields = ["radius", "bgColor", "textColor"];
  const result: Record<string, unknown> = {};

  for (const key of FIELD_ORDER) {
    const field = fields[key];
    if (field == null) continue;

    if (variantMode === "theme" && styleFields.includes(key)) continue;
    if (variantMode === "custom" && key === "chipVariant") continue;
    if (variantMode === "custom" && key === "shape") continue;

    result[key] = field;
  }

  return result as Fields<ChipProps>;
}

export const Chip: typeof WithLayoutChip = {
  ...WithLayoutChip,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutChip as { resolveFields?: (typeof WithLayoutChip)["resolveFields"] }
    ).resolveFields;
    const base = resolver?.(data, params);
    const apply = (f: Record<string, unknown>) =>
      resolveChipFields(f, data) as Fields<WithLayout<ChipProps>>;

    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Record<string, unknown>>).then(apply);
    }
    if (base == null) {
      return apply(ChipInner.fields as unknown as Record<string, unknown>);
    }
    return apply(base as Record<string, unknown>);
  },
};
