"use client";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Input } from "@workspace/ui/components/input";

export type ThemeFixedSelectType = "number" | "color" | "text";

export type ThemeFixedOption = {
  label: string;
  value: string;
};

export type ThemeFixedSelectOptions = {
  label: string;
  themeOptions: ThemeFixedOption[];
  type?: ThemeFixedSelectType;
  placeholder?: string;
};

const FIXED_VALUE = "__fixed__";

export function resolveThemeFixedValue(value: string, prefix: string, mapToVar: (key: string) => string): string {
  if (!value) return "";
  if (value.startsWith(`theme-`)) {
    return mapToVar(value.replace(`theme-`, ""));
  }
  return value;
}

function ThemeFixedSelectRender({
  field,
  value,
  onChange,
  readOnly,
  Label,
  label,
}: {
  field: Record<string, unknown>;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  Label: React.FC<{ label?: string; readOnly?: boolean; children?: React.ReactNode }>;
  label?: string;
}) {
  const opts = field._opts as ThemeFixedSelectOptions;
  const currentValue = value ?? "";
  const isThemeValue = opts.themeOptions.some((o) => `theme-${o.value}` === currentValue);
  const isFixed = !isThemeValue;
  const selectValue = isFixed ? FIXED_VALUE : currentValue;

  return (
    <Label label={label} readOnly={readOnly}>
    <div className="flex flex-col gap-1.5">
      <Select
        value={selectValue}
        onValueChange={(v) => {
          if (v === FIXED_VALUE) {
            onChange("");
          } else {
            onChange(v);
          }
        }}
        disabled={readOnly}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder="اختر" />
        </SelectTrigger>
        <SelectContent>
          {opts.themeOptions.map((opt) => (
            <SelectItem key={opt.value} value={`theme-${opt.value}`}>
              {opt.label}
            </SelectItem>
          ))}
          <SelectItem value={FIXED_VALUE}>ثابت (مخصص)</SelectItem>
        </SelectContent>
      </Select>
      {isFixed && (
        <div>
          {opts.type === "color" ? (
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(currentValue) ? currentValue : "#000000"}
                onChange={(e) => onChange(e.target.value)}
                disabled={readOnly}
                className="size-7 shrink-0 cursor-pointer border-none bg-transparent p-0"
              />
              <Input
                value={currentValue}
                onChange={(e) => onChange(e.target.value)}
                placeholder={opts.placeholder || "#000000"}
                disabled={readOnly}
                spellCheck={false}
                maxLength={7}
              />
            </div>
          ) : (
            <Input
              type={opts.type === "number" ? "number" : "text"}
              value={currentValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder={opts.placeholder || "القيمة بالبكسل"}
              disabled={readOnly}
              min={opts.type === "number" ? 0 : undefined}
            />
          )}
        </div>
      )}
    </div>
    </Label>
  );
}

export function themeFixedSelectField(opts: ThemeFixedSelectOptions): any {
  return {
    type: "custom",
    label: opts.label,
    _opts: opts,
    render: (props: any) => <ThemeFixedSelectRender {...props} field={{ ...(props.field || {}), _opts: opts }} />,
  };
}
