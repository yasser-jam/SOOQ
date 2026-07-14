"use client";
import React, { useMemo, useState } from "react";
import { useAppStore } from "@/core/store";
import { cn } from "@workspace/ui/lib/utils";
import {
  DEFAULT_SPACING_SCALE,
  type SpacingScaleProps,
} from "../../theme";
import { spacingOptions } from "../../options";

/**
 * Named spacing levels instead of raw px dropdowns. Merchants pick
 * بدون / ضيقة / متوسطة / واسعة; the level→px mapping comes from the theme's
 * spacing scale (root props, editable in the settings panel) so the whole
 * store keeps one rhythm. Values are still persisted as plain px strings —
 * an existing value that matches no level shows as «مخصص» with the classic
 * px select, so nothing saved ever becomes uneditable.
 */

export type SpacingAxis = "vertical" | "side";

type LevelKey = "none" | "narrow" | "medium" | "wide";

const LEVEL_LABELS: Record<LevelKey, string> = {
  none: "بدون",
  narrow: "ضيقة",
  medium: "متوسطة",
  wide: "واسعة",
};

const SCALE_PROP_KEYS: Record<
  SpacingAxis,
  Record<Exclude<LevelKey, "none">, keyof SpacingScaleProps>
> = {
  vertical: {
    narrow: "spacingVerticalNarrow",
    medium: "spacingVerticalMedium",
    wide: "spacingVerticalWide",
  },
  side: {
    narrow: "spacingSideNarrow",
    medium: "spacingSideMedium",
    wide: "spacingSideWide",
  },
};

/** Level→px map for an axis, read from root props with stock fallbacks. */
export const resolveSpacingScale = (
  rootProps: Record<string, unknown> | undefined,
  axis: SpacingAxis
): Record<LevelKey, string> => {
  const keys = SCALE_PROP_KEYS[axis];
  const read = (key: keyof SpacingScaleProps): string => {
    const raw = rootProps?.[key];
    return typeof raw === "string" && /^\d+px$/.test(raw.trim())
      ? raw.trim()
      : DEFAULT_SPACING_SCALE[key];
  };
  return {
    none: "0px",
    narrow: read(keys.narrow),
    medium: read(keys.medium),
    wide: read(keys.wide),
  };
};

/** The level a stored px value corresponds to, or null when off-scale. */
export const matchSpacingLevel = (
  value: string | undefined,
  scale: Record<LevelKey, string>
): LevelKey | null => {
  const raw = (value ?? "").trim();
  const normalized = raw === "" || raw === "0" ? "0px" : raw;
  const entry = (Object.entries(scale) as [LevelKey, string][]).find(
    ([, px]) => px === normalized
  );
  return entry ? entry[0] : null;
};

const LEVEL_ORDER: LevelKey[] = ["none", "narrow", "medium", "wide"];

const SpacingLevelPicker = ({
  value,
  onChange,
  readOnly,
  axis,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  readOnly?: boolean;
  axis: SpacingAxis;
}) => {
  const rootProps = useAppStore(
    (s) => s.state.data.root.props as Record<string, unknown> | undefined
  );
  const scale = useMemo(
    () => resolveSpacingScale(rootProps, axis),
    [rootProps, axis]
  );

  const matched = matchSpacingLevel(value, scale);
  const [customOpen, setCustomOpen] = useState(false);
  const showCustom = customOpen || matched === null;

  const raw = (value ?? "").trim() || "0px";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1 rounded-lg bg-muted p-[3px]">
        {LEVEL_ORDER.map((level) => {
          const active = !showCustom && matched === level;
          return (
            <button
              key={level}
              type="button"
              disabled={readOnly}
              aria-pressed={active}
              onClick={() => {
                setCustomOpen(false);
                onChange(scale[level]);
              }}
              title={scale[level]}
              className={cn(
                "min-w-0 flex-1 truncate rounded-md px-0.5 py-1 text-[10px] font-bold text-muted-foreground transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-60",
                active && "bg-white text-foreground shadow-sm"
              )}
            >
              {LEVEL_LABELS[level]}
            </button>
          );
        })}
        <button
          type="button"
          disabled={readOnly}
          aria-pressed={showCustom}
          onClick={() => setCustomOpen(true)}
          className={cn(
            "min-w-0 flex-1 truncate rounded-md px-0.5 py-1 text-[10px] font-bold text-muted-foreground transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-60",
            showCustom && "bg-white text-foreground shadow-sm"
          )}
        >
          مخصص
        </button>
      </div>

      {showCustom ? (
        <select
          value={raw}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-xs text-foreground"
          aria-label="قيمة مخصصة بالبكسل"
        >
          {!spacingOptions.some((o) => o.value === raw) && raw !== "0px" ? (
            <option value={raw}>{raw}</option>
          ) : null}
          <option value="0px">0px</option>
          {spacingOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <div
          className="text-center text-[10px] tabular-nums text-muted-foreground"
          dir="rtl"
        >
          {matched ? (
            <>
              {LEVEL_LABELS[matched]} · <span dir="ltr">{scale[matched]}</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

/**
 * Declare a named spacing field in one line:
 *
 *     paddingTop: createSpacingField({ label: "من الأعلى", axis: "vertical" }),
 */
export const createSpacingField = ({
  label,
  axis,
  group = "layout",
}: {
  label: string;
  axis: SpacingAxis;
  group?: string;
}) => ({
  type: "custom" as const,
  label,
  metadata: { group },
  render: (props: any) => {
    const { value, onChange, readOnly, Label, label: fieldLabel } = props;
    return (
      <Label label={fieldLabel ?? label} readOnly={readOnly}>
        <SpacingLevelPicker
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          axis={axis}
        />
      </Label>
    );
  },
});
