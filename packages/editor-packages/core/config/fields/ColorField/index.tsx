import React, { useMemo } from "react";
import { FieldLabel } from "@/core";
import { Palette, RotateCcw } from "lucide-react";
import { getClassNameFactory } from "@/core/lib";

import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ColorField", styles);

/**
 * ColorField — a compact, visual colour picker used across the root Settings
 * panel (header, footer, drawer). It replaces plain text inputs so merchants
 * can see the colour they're editing as a real swatch and tweak it with the
 * native eye-dropper/picker.
 *
 * Value is always persisted as a CSS colour string (`#rrggbb`, `rgb(...)` or
 * a short hex), so the resulting `store_config.json` stays portable. An
 * empty string means "inherit the theme default" — the clear button resets
 * to that state.
 */

export type ColorFieldProps = {
  value: string | undefined;
  onChange: (value: string) => void;
  readOnly?: boolean;
  label?: string;
  description?: string;
  /** Quick palette chips above the picker. */
  swatches?: string[];
  /** Default label/icon tweaks. */
  icon?: React.ReactNode;
};

const DEFAULT_SWATCHES = [
  "#ffffff",
  "#111827",
  "#f5f5f5",
  "#0f172a",
  "#1d4ed8",
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

/** Accept `#rgb` or `#rrggbb` — normalise to 6-digit hex for <input type="color" />. */
const toHex = (value: string | undefined): string => {
  if (!value) return "#000000";
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#000000";
};

export function ColorField({
  value,
  onChange,
  readOnly,
  label = "Colour",
  description,
  swatches = DEFAULT_SWATCHES,
  icon = <Palette size={14} />,
}: ColorFieldProps) {
  const raw = (value ?? "").trim();
  const hex = useMemo(() => toHex(raw), [raw]);
  const isEmpty = raw.length === 0;

  return (
    <FieldLabel label={label} icon={icon}>
      <div className={getClassName()}>
        <div className={getClassName("row")}>
          <label className={getClassName("swatchWrap")} aria-label="Pick colour">
            <span
              className={getClassName("swatch")}
              style={{
                background: isEmpty
                  ? "repeating-conic-gradient(#d1d5db 0% 25%, #ffffff 0% 50%) 50%/10px 10px"
                  : raw,
              }}
            />
            <input
              type="color"
              className={getClassName("nativeInput")}
              value={hex}
              disabled={readOnly}
              onChange={(e) => onChange(e.target.value)}
            />
          </label>

          <input
            type="text"
            className={getClassName("textInput")}
            placeholder="#ffffff or theme default"
            value={raw}
            disabled={readOnly}
            onChange={(e) => onChange(e.target.value)}
          />

          {!isEmpty && !readOnly && (
            <button
              type="button"
              className={getClassName("clearBtn")}
              title="Clear (use theme default)"
              onClick={() => onChange("")}
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {swatches && swatches.length > 0 && !readOnly && (
          <div className={getClassName("swatches")}>
            {swatches.map((c) => (
              <button
                key={c}
                type="button"
                className={`${getClassName("chip")} ${
                  raw.toLowerCase() === c.toLowerCase()
                    ? getClassName("chipActive")
                    : ""
                }`}
                style={{ background: c }}
                title={c}
                onClick={() => onChange(c)}
                aria-label={`Use ${c}`}
              />
            ))}
          </div>
        )}

        {description && (
          <p className={getClassName("desc")}>{description}</p>
        )}
      </div>
    </FieldLabel>
  );
}

/**
 * Convenience helper to declare a Puck `custom` field in a config with a
 * single line:
 *
 *     someColor: colorField({ label: "Background", description: "..." }),
 */
export const colorField = (options: {
  label: string;
  description?: string;
  swatches?: string[];
  icon?: React.ReactNode;
}) =>
  ({
    type: "custom" as const,
    label: options.label,
    render: ({ value, onChange, readOnly }: any) => (
      <ColorField
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        label={options.label}
        description={options.description}
        swatches={options.swatches}
        icon={options.icon}
      />
    ),
  });
