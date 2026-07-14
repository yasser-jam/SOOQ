"use client";
import React, { useMemo } from "react";
import { useAppStore } from "@/core/store";
import { cn } from "@workspace/ui/lib/utils";
import { DEFAULT_COLORS } from "../../theme";

/**
 * Image-overlay field: replaces the raw `rgba(0, 0, 0, 0.45)` text input with
 * a live demo — a sample cover (the section's own background image when set)
 * with sample text on top, three base-color chips (dark / brand / light) and
 * an intensity slider. The merchant sees exactly when the text becomes
 * readable. Persists the same rgba() string format as before.
 */

type Rgb = { r: number; g: number; b: number };

const DARK: Rgb = { r: 0, g: 0, b: 0 };
const LIGHT: Rgb = { r: 255, g: 255, b: 255 };

export const hexToRgb = (hex: string): Rgb | null => {
  const full = /^#[0-9a-fA-F]{3}$/.test(hex)
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  if (!/^#[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = parseInt(full.slice(1), 16);
  return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 };
};

/** Parse a stored overlay value (rgba()/rgb()/hex) into base color + alpha. */
export const parseOverlayValue = (
  value: string | undefined
): { rgb: Rgb; alpha: number } | null => {
  const raw = (value ?? "").trim();
  if (raw === "") return null;

  const rgbaMatch = raw.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i
  );
  if (rgbaMatch) {
    return {
      rgb: {
        r: Number(rgbaMatch[1]),
        g: Number(rgbaMatch[2]),
        b: Number(rgbaMatch[3]),
      },
      alpha: rgbaMatch[4] !== undefined ? Number(rgbaMatch[4]) : 1,
    };
  }

  const rgb = hexToRgb(raw);
  if (rgb) return { rgb, alpha: 1 };

  return null;
};

export const formatOverlayValue = (rgb: Rgb, alpha: number): string =>
  alpha <= 0
    ? ""
    : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.round(alpha * 100) / 100})`;

const sameRgb = (a: Rgb, b: Rgb) => a.r === b.r && a.g === b.g && a.b === b.b;

const DEMO_BACKGROUND =
  "radial-gradient(circle at 75% 20%, rgba(255,255,255,.55), transparent 42%)," +
  "radial-gradient(circle at 18% 85%, rgba(255,210,120,.8), transparent 50%)," +
  "linear-gradient(130deg, #f59e0b, #ef4444 60%, #b91c1c)";

const OverlayPicker = ({
  value,
  onChange,
  readOnly,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) => {
  const rootProps = useAppStore(
    (s) => s.state.data.root.props as Record<string, unknown> | undefined
  );
  // Demo shows the section's own background image when one is set.
  const backgroundImage = useAppStore((s) => {
    const img = (s.selectedItem?.props as { backgroundImage?: string })
      ?.backgroundImage;
    return typeof img === "string" ? img.trim() : "";
  });

  const brand = useMemo(() => {
    const raw = rootProps?.primary;
    return (
      hexToRgb(typeof raw === "string" ? raw : "") ??
      hexToRgb(DEFAULT_COLORS.primary)!
    );
  }, [rootProps]);

  const parsed = parseOverlayValue(value);
  const rgb = parsed?.rgb ?? DARK;
  const alpha = parsed?.alpha ?? 0;
  const pct = Math.round(alpha * 100);

  const chips: Array<{ title: string; rgb: Rgb; swatch: string }> = [
    { title: "داكن", rgb: DARK, swatch: "#111827" },
    {
      title: "اللون الأساسي",
      rgb: brand,
      swatch: `rgb(${brand.r}, ${brand.g}, ${brand.b})`,
    },
    { title: "فاتح", rgb: LIGHT, swatch: "#ffffff" },
  ];

  const setOverlay = (nextRgb: Rgb, nextPct: number) => {
    onChange(formatOverlayValue(nextRgb, nextPct / 100));
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative h-24 overflow-hidden rounded-lg"
        style={{
          background: backgroundImage
            ? `url(${backgroundImage}) center / cover no-repeat`
            : DEMO_BACKGROUND,
        }}
      >
        <div
          className="absolute inset-0 transition-colors"
          style={{ backgroundColor: formatOverlayValue(rgb, alpha) || "transparent" }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center text-white">
          <span className="text-sm font-extrabold drop-shadow-[0_1px_2px_rgba(0,0,0,.2)]">
            تخفيضات الصيف
          </span>
          <span className="text-[10px] opacity-90">
            هكذا سيبدو النص فوق صورتك
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1.5">
          {chips.map((chip) => {
            const active = parsed !== null && sameRgb(rgb, chip.rgb);
            return (
              <button
                key={chip.title}
                type="button"
                disabled={readOnly}
                title={chip.title}
                aria-pressed={active}
                onClick={() => setOverlay(chip.rgb, pct > 0 ? pct : 45)}
                className={cn(
                  "size-6 rounded-md shadow-[inset_0_0_0_1px_rgba(0,0,0,.15)] transition-shadow",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  active && "ring-2 ring-primary ring-offset-1"
                )}
                style={{ background: chip.swatch }}
              />
            );
          })}
        </div>
        <input
          type="range"
          min={0}
          max={80}
          step={5}
          value={pct}
          disabled={readOnly}
          onChange={(e) => setOverlay(rgb, Number(e.target.value))}
          className={cn(
            "h-1.5 flex-1 cursor-pointer accent-primary",
            readOnly && "cursor-not-allowed opacity-60"
          )}
          aria-label="شدة التغطية"
        />
        <span className="min-w-9 text-end text-[11px] font-bold tabular-nums text-primary">
          {pct}%
        </span>
      </div>
    </div>
  );
};

/**
 * Declare the overlay field in one line:
 *
 *     backgroundOverlayColor: createOverlayField({ label: "التغطية فوق الصورة" }),
 */
export const createOverlayField = ({
  label,
  group = "background",
}: {
  label: string;
  group?: string;
}) => ({
  type: "custom" as const,
  label,
  metadata: { group },
  render: (props: any) => {
    const { value, onChange, readOnly, Label, label: fieldLabel } = props;
    return (
      <Label label={fieldLabel ?? label} readOnly={readOnly}>
        <OverlayPicker value={value} onChange={onChange} readOnly={readOnly} />
      </Label>
    );
  },
});
