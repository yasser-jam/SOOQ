"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAppStore } from "@/core/store";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { DEFAULT_COLORS, type ColorKey } from "../../theme";

/**
 * The unified color input used across the properties panel (background,
 * border color). Closed it shows the current color as a chip + name + value;
 * open it expands an INLINE panel (no portal/popover — the sidebar is ~220px
 * wide and Radix popper misplaced the floating content there) with the
 * store's theme palette by name, a custom picker, and a live preview strip.
 *
 * Two value modes keep every existing data format intact:
 *  - "hex":       stores raw CSS colors ("#ffffff", "transparent") — used by
 *                 Section.backgroundColor and layout.borderColor.
 *  - "theme-ref": stores "theme-<key>" references resolved to CSS vars at
 *                 render time.
 *
 * Text colors use PlainColorInput below instead (a normal color picker,
 * per merchant feedback).
 */

export type ThemeColorContext = "background" | "text" | "border";
export type ThemeColorValueMode = "hex" | "theme-ref";

// Arabic palette labels — kept here (not imported from content/color-fields)
// so the shared `colorField` there can import this module without a cycle.
const THEME_COLOR_OPTIONS: { label: string; value: ColorKey }[] = [
  { label: "أساسي", value: "primary" },
  { label: "سطح", value: "surface" },
  { label: "نجاح", value: "success" },
  { label: "تحذير", value: "warning" },
  { label: "خطأ", value: "error" },
  { label: "داكن", value: "dark" },
  { label: "نص", value: "text" },
  { label: "محايد", value: "neutral" },
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const toDisplayHex = (raw: string): string =>
  /^#[0-9a-fA-F]{3}$/.test(raw)
    ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
    : raw;

/** Perceived luminance 0..1 — decides the contrast text in previews. */
export const colorLuminance = (hex: string): number => {
  const full = toDisplayHex(hex);
  if (!HEX_RE.test(full)) return 1;
  const n = parseInt(full.slice(1), 16);
  return (
    (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  );
};

export type Swatch = { name: string; hex: string; store: string };

/** Theme palette resolved from root props (falls back to stock defaults). */
export const buildSwatches = (
  rootProps: Record<string, unknown> | undefined,
  valueMode: ThemeColorValueMode,
  allowTransparent: boolean
): Swatch[] => {
  const themed = THEME_COLOR_OPTIONS.map(({ label, value }) => {
    const raw = rootProps?.[value];
    const hex =
      typeof raw === "string" && raw.trim() !== ""
        ? raw.trim()
        : DEFAULT_COLORS[value as ColorKey];
    return {
      name: label,
      hex,
      store: valueMode === "theme-ref" ? `theme-${value}` : hex,
    };
  });

  const extras: Swatch[] = [{ name: "أبيض", hex: "#ffffff", store: "#ffffff" }];
  if (allowTransparent && valueMode === "hex") {
    extras.push({ name: "شفاف", hex: "transparent", store: "transparent" });
  }

  return [...themed, ...extras];
};

/** Resolve the display name + hex of the current value against the palette. */
export const describeColorValue = (
  value: string | undefined,
  swatches: Swatch[]
): { name: string; hex: string; isCustom: boolean } => {
  const raw = (value ?? "").trim();
  if (raw === "") return { name: "افتراضي", hex: "", isCustom: false };

  const match = swatches.find(
    (s) => s.store.toLowerCase() === raw.toLowerCase()
  );
  if (match) return { name: match.name, hex: match.hex, isCustom: false };

  // theme-ref value pointing at an unknown key — show the raw reference
  if (raw.startsWith("theme-")) {
    return { name: raw.slice(6), hex: "#94a3b8", isCustom: false };
  }

  return { name: "مخصص", hex: toDisplayHex(raw), isCustom: true };
};

const CHECKER =
  "repeating-conic-gradient(#d1d5db 0% 25%, #ffffff 0% 50%) 50% / 10px 10px";

const chipBackground = (hex: string): string =>
  hex === "" || hex === "transparent" ? CHECKER : hex;

const PreviewStrip = ({
  context,
  hex,
}: {
  context: ThemeColorContext;
  hex: string;
}) => {
  const effective = hex === "" || hex === "transparent" ? "#ffffff" : hex;
  const base =
    "flex min-h-10 items-center justify-center rounded-lg text-[11px] font-bold transition-colors";

  if (context === "text") {
    return (
      <div
        className={cn(base, "border border-border bg-white")}
        style={{ color: effective }}
      >
        نص بهذا اللون
      </div>
    );
  }
  if (context === "border") {
    return (
      <div
        className={cn(base, "bg-white text-muted-foreground")}
        style={{ border: `2px solid ${effective}` }}
      >
        إطار بهذا اللون
      </div>
    );
  }
  return (
    <div
      className={base}
      style={{
        background: chipBackground(hex),
        border: "1px solid rgba(0,0,0,.08)",
        color: colorLuminance(effective) > 0.6 ? "#1c2433" : "#ffffff",
      }}
    >
      نص فوق هذه الخلفية
    </div>
  );
};

export type ThemeColorPickerProps = {
  value: string | undefined;
  onChange: (value: string) => void;
  readOnly?: boolean;
  context?: ThemeColorContext;
  valueMode?: ThemeColorValueMode;
  allowTransparent?: boolean;
};

export function ThemeColorPicker({
  value,
  onChange,
  readOnly,
  context = "background",
  valueMode = "hex",
  allowTransparent = false,
}: ThemeColorPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rootProps = useAppStore(
    (s) => s.state.data.root.props as Record<string, unknown> | undefined
  );

  // Close on outside click / Escape — the panel is inline, no portal.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const swatches = useMemo(
    () => buildSwatches(rootProps, valueMode, allowTransparent),
    [rootProps, valueMode, allowTransparent]
  );

  const current = useMemo(
    () => describeColorValue(value, swatches),
    [value, swatches]
  );

  const customHex = HEX_RE.test(current.hex) ? current.hex : "#3563e9";
  const raw = (value ?? "").trim();

  return (
    <div ref={rootRef} className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={readOnly}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md border border-border bg-white px-2.5 py-1.5",
          "text-xs text-foreground transition-colors hover:border-primary/50",
          "disabled:cursor-not-allowed disabled:opacity-60",
          open && "border-primary/60"
        )}
      >
        <span
          className="size-5 shrink-0 rounded-md shadow-[inset_0_0_0_1px_rgba(0,0,0,.14)]"
          style={{ background: chipBackground(current.hex) }}
        />
        <span className="min-w-0 flex-1 truncate text-start font-bold">
          {current.name}
        </span>
        <ChevronDown
          size={13}
          className={cn(
            "shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-2.5 shadow-md">
          <div>
            <div className="mb-2 text-[10.5px] font-extrabold tracking-wide text-muted-foreground">
              ألوان الثيم
            </div>
            <div className="grid grid-cols-4 gap-x-1 gap-y-2">
              {swatches.map((swatch) => {
                const selected =
                  raw.toLowerCase() === swatch.store.toLowerCase();
                return (
                  <button
                    key={swatch.store}
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      onChange(swatch.store);
                      setOpen(false);
                    }}
                    className="flex min-w-0 flex-col items-center gap-1"
                    title={swatch.name}
                  >
                    <span
                      className={cn(
                        "grid size-7 place-items-center rounded-lg text-white shadow-[inset_0_0_0_1px_rgba(0,0,0,.12)]",
                        selected && "ring-2 ring-primary ring-offset-1"
                      )}
                      style={{ background: chipBackground(swatch.hex) }}
                    >
                      {selected ? (
                        <span className="text-[11px] font-extrabold drop-shadow-[0_1px_2px_rgba(0,0,0,.45)]">
                          ✓
                        </span>
                      ) : null}
                    </span>
                    <span className="max-w-full truncate text-[9px] font-bold text-muted-foreground">
                      {swatch.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-t border-dashed border-border pt-2.5">
            <input
              type="color"
              aria-label="اختيار لون مخصص"
              value={customHex}
              disabled={readOnly}
              onChange={(e) => onChange(e.target.value)}
              className="h-7 w-8 shrink-0 cursor-pointer rounded-md border border-border bg-white p-0.5"
            />
            <Input
              value={raw.startsWith("theme-") ? "" : raw}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              disabled={readOnly}
              spellCheck={false}
              dir="ltr"
              className="h-7 min-w-0 flex-1 text-left text-[11px] tabular-nums"
            />
          </div>

          <PreviewStrip context={context} hex={current.hex} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * The "normal" color picker used for text colors (لون النص) — a native
 * color input + hex field, no theme panel, per merchant feedback. Existing
 * "theme-<key>" values are resolved to their current hex for display; the
 * first edit persists a plain hex string (which every renderer accepts).
 */
export function PlainColorInput({
  value,
  onChange,
  readOnly,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  const rootProps = useAppStore(
    (s) => s.state.data.root.props as Record<string, unknown> | undefined
  );

  const raw = (value ?? "").trim();
  const displayHex = useMemo(() => {
    if (raw.startsWith("theme-")) {
      const key = raw.slice(6) as ColorKey;
      const fromTheme = rootProps?.[key];
      const hex =
        typeof fromTheme === "string" && HEX_RE.test(fromTheme.trim())
          ? fromTheme.trim()
          : DEFAULT_COLORS[key];
      return hex && HEX_RE.test(hex) ? hex : "#14243f";
    }
    const full = toDisplayHex(raw);
    return HEX_RE.test(full) ? full : "#14243f";
  }, [raw, rootProps]);

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        aria-label="اختيار اللون"
        value={displayHex}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-9 shrink-0 cursor-pointer rounded-md border border-border bg-white p-0.5"
      />
      <Input
        value={raw.startsWith("theme-") ? displayHex : raw}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        disabled={readOnly}
        spellCheck={false}
        dir="ltr"
        maxLength={20}
        className="h-8 min-w-0 flex-1 text-left text-[11px] tabular-nums"
      />
    </div>
  );
}

const DEFAULT_GROUP: Record<ThemeColorContext, string> = {
  background: "background",
  text: "typography",
  border: "border",
};

/**
 * Declare a unified theme color field in one line:
 *
 *     backgroundColor: createThemeColorField({
 *       label: "لون الخلفية",
 *       context: "background",
 *       allowTransparent: true,
 *     }),
 */
export const createThemeColorField = ({
  label,
  context = "background",
  valueMode = "hex",
  allowTransparent = false,
  group,
}: {
  label: string;
  context?: ThemeColorContext;
  valueMode?: ThemeColorValueMode;
  allowTransparent?: boolean;
  group?: string;
}) => ({
  type: "custom" as const,
  label,
  metadata: { group: group ?? DEFAULT_GROUP[context] },
  // The fork's AutoField passes `Label` to custom renders at runtime, but
  // upstream's CustomFieldRender type doesn't declare it — same `props: any`
  // escape hatch the other field factories use.
  render: (props: any) => {
    const { value, onChange, readOnly, Label, label: fieldLabel } = props;
    return (
      <Label label={fieldLabel ?? label} readOnly={readOnly}>
        <ThemeColorPicker
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          context={context}
          valueMode={valueMode}
          allowTransparent={allowTransparent}
        />
      </Label>
    );
  },
});
