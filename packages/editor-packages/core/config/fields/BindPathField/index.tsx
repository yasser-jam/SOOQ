"use client";

import React from "react";
import { Link2, RotateCcw } from "lucide-react";
import { FieldLabel } from "@/core";
import { getClassNameFactory } from "@/core/lib";
import type { ValueContext } from "../../binding";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("BindPathField", styles);

/**
 * Edits a block's `valueContext` — the `{ path }` that `useBoundValue` resolves against
 * whatever data the page currently has bound (e.g. the product on a `/products/:slug` route).
 * Empty path = unbound, so the block's own static value (text/src typed above) is used as-is.
 * See `resolveValueContext` (`config/binding/resolve-value-context.ts`) for the path syntax —
 * dot/bracket paths, `*Ar`/`*En` handled automatically (`product.title`, `pricing.displayPrice`,
 * `images[0].url`).
 */
export type BindPathFieldProps = {
  value: ValueContext | null | undefined;
  onChange: (value: ValueContext | null) => void;
  readOnly?: boolean;
  label?: string;
  placeholder?: string;
  hint?: string;
};

/**
 * A blank path means "not bound" — `null`, not `{ path: "" }`, so `useBoundValue` takes its
 * static-value fallback instead of trying to resolve an empty path. Preserves any other
 * `ValueContext` fields already set (`format`, `fallbackToStatic`, …) when only the path changes.
 */
export function nextValueContextForPath(
  current: ValueContext | null | undefined,
  nextPath: string
): ValueContext | null {
  const trimmed = nextPath.trim();
  if (!trimmed) return null;
  return { ...(current ?? {}), path: trimmed };
}

export function BindPathField({
  value,
  onChange,
  readOnly,
  label = "ربط بالبيانات (اختياري)",
  placeholder = "product.title",
  hint = "اتركه فارغاً لاستخدام القيمة الثابتة أعلاه. عند تعبئته، تُستبدل بما توفره الصفحة من بيانات — مثال: منتج الصفحة الحالية.",
}: BindPathFieldProps) {
  const path = value?.path ?? "";

  return (
    <FieldLabel label={label} icon={<Link2 size={14} />}>
      <div className={getClassName()}>
        <div className={getClassName("row")}>
          <input
            type="text"
            className={getClassName("input")}
            placeholder={placeholder}
            value={path}
            disabled={readOnly}
            onChange={(e) => onChange(nextValueContextForPath(value, e.target.value))}
          />
          {path && !readOnly && (
            <button
              type="button"
              className={getClassName("clearBtn")}
              title="إزالة الربط"
              onClick={() => onChange(null)}
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
        {hint ? <p className={getClassName("hint")}>{hint}</p> : null}
      </div>
    </FieldLabel>
  );
}

/**
 * Convenience helper to declare a Puck `custom` field in one line:
 *
 *     valueContext: bindPathField({ label: "..." }),
 */
export const bindPathField = (options: {
  label?: string;
  placeholder?: string;
  hint?: string;
} = {}) =>
  ({
    type: "custom" as const,
    label: options.label ?? "ربط بالبيانات (اختياري)",
    render: ({ value, onChange, readOnly }: any) => (
      <BindPathField
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        label={options.label}
        placeholder={options.placeholder}
        hint={options.hint}
      />
    ),
  });
