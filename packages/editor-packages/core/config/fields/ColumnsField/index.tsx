"use client";
import React from "react";
import { cn } from "@workspace/ui/lib/utils";

/**
 * Column-count field: a slider with a live mini-grid preview, replacing the
 * numeric select — the merchant sees the split instead of reading a number.
 * Reused for both the desktop `columns` field and the `columnsMobile` field
 * (Section block) that drives the storefront's responsive column count.
 */

const AR_COUNT_LABELS = [
  "",
  "عمود واحد",
  "عمودان",
  "٣ أعمدة",
  "٤ أعمدة",
  "٥ أعمدة",
  "٦ أعمدة",
];

export const clampColumns = (raw: unknown, max: number): number => {
  const n = Number(raw ?? 1);
  return Math.max(1, Math.min(max, Number.isFinite(n) ? Math.round(n) : 1));
};

const ColumnsPicker = ({
  value,
  onChange,
  readOnly,
  max,
}: {
  value: number | string | undefined;
  onChange: (value: number) => void;
  readOnly?: boolean;
  max: number;
}) => {
  const current = clampColumns(value, max);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-8 gap-1.5" aria-hidden>
        {Array.from({ length: current }, (_, i) => (
          <div
            key={i}
            className="flex-1 rounded-md border border-primary/25 bg-primary/10"
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={1}
          max={max}
          step={1}
          value={current}
          disabled={readOnly}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            "h-1.5 flex-1 cursor-pointer accent-primary",
            readOnly && "cursor-not-allowed opacity-60"
          )}
          aria-label="عدد الأعمدة"
        />
        <span className="min-w-16 text-end text-[11px] font-bold tabular-nums text-primary">
          {AR_COUNT_LABELS[current] ?? String(current)}
        </span>
      </div>
    </div>
  );
};

/**
 * Declare a columns field in one line:
 *
 *     columns: createColumnsField({ label: "أعمدة المحتوى" }),
 */
export const createColumnsField = ({
  label,
  max = 6,
  group = "layout",
}: {
  label: string;
  max?: number;
  group?: string;
}) => ({
  type: "custom" as const,
  label,
  metadata: { group },
  render: (props: any) => {
    const { value, onChange, readOnly, Label, label: fieldLabel } = props;
    return (
      <Label label={fieldLabel ?? label} readOnly={readOnly}>
        <ColumnsPicker
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          max={max}
        />
      </Label>
    );
  },
});
