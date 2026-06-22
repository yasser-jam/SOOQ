"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

export interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  presetColors?: string[];
  label?: string;
  className?: string;
}

function normalizeHex(raw: string): string | null {
  const s = raw.trim().replace(/^#/, "");
  if (s.length === 3) {
    const expanded = s
      .split("")
      .map((c) => c + c)
      .join("");
    return `#${expanded.toUpperCase()}`;
  }
  if (s.length === 6) return `#${s.toUpperCase()}`;
  return null;
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function contrastColor(hex: string): string {
  const [, , l] = hexToHsl(hex);
  return l > 55 ? "#1a1a1a" : "#ffffff";
}

const DEFAULT_PRESETS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F43F5E",
  "#64748B",
  "#1a1a1a",
];

interface ColorWheelProps {
  size?: number;
  onSelect: (hex: string) => void;
  currentHex?: string;
}

function ColorWheel({ size = 200, onSelect, currentHex }: ColorWheelProps) {
  const wheelRef = useRef<HTMLCanvasElement>(null);
  const stripRef = useRef<HTMLCanvasElement>(null);
  const [hue, setHue] = useState<number>(() => {
    if (currentHex) {
      const [h] = hexToHsl(currentHex);
      return h;
    }
    return 0;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [stripIsDragging, setStripIsDragging] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number }>(() => {
    return { x: size / 2, y: size / 2 };
  });
  const [stripY, setStripY] = useState<number>(() => {
    if (currentHex) {
      const [h] = hexToHsl(currentHex);
      return (h / 360) * size;
    }
    return 0;
  });

  useEffect(() => {
    const canvas = wheelRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const r = size / 2;

    const grH = ctx.createLinearGradient(0, 0, size, 0);
    grH.addColorStop(0, `hsl(${hue},0%,100%)`);
    grH.addColorStop(1, `hsl(${hue},100%,50%)`);
    ctx.fillStyle = grH;
    ctx.fillRect(0, 0, size, size);

    const grV = ctx.createLinearGradient(0, 0, 0, size);
    grV.addColorStop(0, "rgba(0,0,0,0)");
    grV.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = grV;
    ctx.fillRect(0, 0, size, size);

    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }, [hue, size]);

  useEffect(() => {
    const canvas = stripRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    for (let i = 0; i <= 360; i += 30) {
      grad.addColorStop(i / 360, `hsl(${i},100%,50%)`);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, size);
  }, [size]);

  function pickFromWheel(x: number, y: number) {
    const canvas = wheelRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = size / rect.width;
    const scaleY = size / rect.height;
    const cx = (x - rect.left) * scaleX;
    const cy = (y - rect.top) * scaleY;
    const r = size / 2;
    const dx = cx - r;
    const dy = cy - r;
    if (dx * dx + dy * dy > r * r) return;
    setCursor({ x: cx, y: cy });
    const pixel = ctx.getImageData(Math.round(cx), Math.round(cy), 1, 1).data;
    const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1]
      .toString(16)
      .padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`.toUpperCase();
    onSelect(hex);
  }

  function pickFromStrip(y: number) {
    const canvas = stripRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = size / rect.height;
    const cy = Math.max(0, Math.min(size, (y - rect.top) * scaleY));
    setStripY(cy);
    const newHue = Math.round((cy / size) * 360);
    setHue(newHue);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <canvas
          ref={wheelRef}
          width={size}
          height={size}
          className="rounded-full cursor-crosshair touch-none"
          style={{ width: size, height: size }}
          onMouseDown={(e) => {
            setIsDragging(true);
            pickFromWheel(e.clientX, e.clientY);
          }}
          onMouseMove={(e) => {
            if (isDragging) pickFromWheel(e.clientX, e.clientY);
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={(e) => {
            setIsDragging(true);
            pickFromWheel(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            if (isDragging)
              pickFromWheel(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchEnd={() => setIsDragging(false)}
        />
        <div
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
          style={{ left: cursor.x, top: cursor.y }}
        />
      </div>

      <div className="relative" style={{ width: 16, height: size }}>
        <canvas
          ref={stripRef}
          width={16}
          height={size}
          className="rounded-full cursor-pointer touch-none"
          style={{ width: 16, height: size }}
          onMouseDown={(e) => {
            setStripIsDragging(true);
            pickFromStrip(e.clientY);
          }}
          onMouseMove={(e) => {
            if (stripIsDragging) pickFromStrip(e.clientY);
          }}
          onMouseUp={() => setStripIsDragging(false)}
          onMouseLeave={() => setStripIsDragging(false)}
          onTouchStart={(e) => {
            setStripIsDragging(true);
            pickFromStrip(e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            if (stripIsDragging)
              pickFromStrip(e.touches[0].clientY);
          }}
          onTouchEnd={() => setStripIsDragging(false)}
        />
        <div
          className="pointer-events-none absolute left-1/2 h-2 w-6 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white shadow-md"
          style={{ top: stripY, background: `hsl(${hue},100%,50%)` }}
        />
      </div>
    </div>
  );
}

interface HexInputProps {
  value: string;
  onChange: (hex: string) => void;
}

function HexInput({ value, onChange }: HexInputProps) {
  const [raw, setRaw] = useState(value.replace("#", ""));

  useEffect(() => {
    setRaw(value.replace("#", ""));
  }, [value]);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
      <div
        className="size-5 shrink-0 rounded-md border border-border/60"
        style={{ background: value }}
      />
      <span className="text-sm text-muted-foreground">#</span>
      <input
        type="text"
        maxLength={6}
        value={raw}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
          setRaw(v);
          const norm = normalizeHex(v);
          if (norm) onChange(norm);
        }}
        className="w-20 bg-transparent text-sm font-mono text-foreground outline-none placeholder:text-muted-foreground"
        placeholder="RRGGBB"
        aria-label="Hex colour value"
      />
    </div>
  );
}

export function ColorPicker({
  value,
  onChange,
  presetColors = DEFAULT_PRESETS,
  label,
  className,
}: ColorPickerProps) {
  const [colors, setColors] = useState<string[]>(() => {
    const list = [...presetColors.map((c) => normalizeHex(c) ?? c)];
    if (value) {
      const norm = normalizeHex(value) ?? value;
      if (!list.map((c) => c.toUpperCase()).includes(norm.toUpperCase())) {
        list.push(norm);
      }
    }
    return list;
  });
  const [selected, setSelected] = useState<string | undefined>(() =>
    value ? normalizeHex(value) ?? value : undefined
  );
  const [showWheel, setShowWheel] = useState(false);
  const [wheelColor, setWheelColor] = useState<string>("#FF0000");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) return;
    const norm = normalizeHex(value) ?? value;
    setSelected(norm);
    setColors((prev) => {
      const upper = prev.map((c) => c.toUpperCase());
      if (!upper.includes(norm.toUpperCase())) return [...prev, norm];
      return prev;
    });
  }, [value]);

  useEffect(() => {
    if (!showWheel) return;
    function handler(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setShowWheel(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showWheel]);

  function selectColor(hex: string) {
    const norm = normalizeHex(hex) ?? hex;
    setSelected(norm);
    onChange?.(norm);
  }

  function confirmCustom() {
    const norm = normalizeHex(wheelColor) ?? wheelColor;
    setColors((prev) => {
      const upper = prev.map((c) => c.toUpperCase());
      if (!upper.includes(norm.toUpperCase())) return [...prev, norm];
      return prev;
    });
    selectColor(norm);
    setShowWheel(false);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {colors.map((hex) => {
          const isSelected =
            selected?.toUpperCase() === hex.toUpperCase();
          return (
            <button
              key={hex}
              type="button"
              aria-label={`Select colour ${hex}`}
              aria-pressed={isSelected}
              title={hex}
              onClick={() => selectColor(hex)}
              className={cn(
                "relative size-8 shrink-0 rounded-full transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "scale-110 ring-2 ring-ring ring-offset-2"
                  : "hover:scale-110"
              )}
              style={{ background: hex }}
            >
              {isSelected && (
                <Check
                  className="absolute inset-0 m-auto size-4"
                  style={{ color: contrastColor(hex) }}
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}

        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            aria-label="Choose custom colour"
            aria-expanded={showWheel}
            onClick={() => setShowWheel((v) => !v)}
            className={cn(
              "relative size-8 shrink-0 rounded-full border-2 border-dashed border-border",
              "flex items-center justify-center",
              "transition-all duration-150 hover:scale-110 hover:border-muted-foreground",
              "bg-muted/30 text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            {showWheel ? (
              <X className="size-4" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
          </button>

          {showWheel && (
            <div
              className={cn(
                "absolute left-0 top-10 z-50",
                "rounded-2xl border border-border bg-popover p-4 shadow-xl",
                "flex flex-col gap-4",
                "animate-in fade-in-0 zoom-in-95 duration-150"
              )}
              style={{ minWidth: 260 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Custom colour
                </span>
                <button
                  type="button"
                  onClick={() => setShowWheel(false)}
                  aria-label="Close colour wheel"
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </div>

              <ColorWheel
                size={200}
                onSelect={setWheelColor}
                currentHex={wheelColor}
              />

              <HexInput value={wheelColor} onChange={setWheelColor} />

              <div className="flex items-center gap-2">
                <div
                  className="h-9 flex-1 rounded-lg border border-border/50"
                  style={{ background: wheelColor }}
                  aria-label={`Preview: ${wheelColor}`}
                />
                <button
                  type="button"
                  onClick={confirmCustom}
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-medium",
                    "transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  )}
                  style={{
                    background: wheelColor,
                    color: contrastColor(wheelColor),
                  }}
                >
                  <Check className="size-3.5" aria-hidden="true" />
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="flex items-center gap-2">
          <div
            className="size-3 rounded-full border border-border/40"
            style={{ background: selected }}
            aria-hidden="true"
          />
          <span className="font-mono text-xs text-muted-foreground">
            {selected}
          </span>
        </div>
      )}
    </div>
  );
}
