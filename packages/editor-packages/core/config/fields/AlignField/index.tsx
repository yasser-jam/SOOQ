"use client";
import React from "react";
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";

/**
 * D-4: shared alignment icon-toggle field. Was copy-pasted (inline styles and
 * all) in ContentHeading, ContentParagraph, ContentButton, ButtonGroup,
 * ContentLink and ContentImage — differing only in the default value.
 */

type AlignValue = "right" | "center" | "left";

type AlignFieldRenderProps = {
  value: AlignValue | undefined;
  onChange: (v: AlignValue) => void;
  Label: React.FC<{
    label?: string;
    readOnly?: boolean;
    children?: React.ReactNode;
  }>;
  label?: string;
  readOnly?: boolean;
};

const OPTIONS: Array<{ value: AlignValue; icon: React.ReactNode; label: string }> = [
  { value: "right", icon: <AlignRight size={18} />, label: "يمين" },
  { value: "center", icon: <AlignCenter size={18} />, label: "وسط" },
  { value: "left", icon: <AlignLeft size={18} />, label: "يسار" },
];

export const createAlignField = ({
  defaultValue = "right",
  label = "المحاذاة",
}: {
  defaultValue?: AlignValue;
  label?: string;
} = {}) => ({
  type: "custom" as const,
  label,
  metadata: { group: "style" },
  // The fork's AutoField passes `Label` to custom renders at runtime, but
  // upstream's CustomFieldRender type doesn't declare it — same `props: any`
  // escape hatch the other field factories (ThemeFixedSelect) use.
  render: (props: any) => {
    const {
      value,
      onChange,
      Label,
      label: fieldLabel,
      readOnly,
    } = props as AlignFieldRenderProps;
    const current = value ?? defaultValue;

    return (
      <Label label={fieldLabel} readOnly={readOnly}>
        <div style={{ display: "flex", gap: 6 }}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              title={opt.label}
              disabled={readOnly}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 32,
                border:
                  current === opt.value
                    ? "2px solid #3b82f6"
                    : "1px solid #d1d5db",
                borderRadius: 6,
                background: current === opt.value ? "#eff6ff" : "#fff",
                cursor: readOnly ? "not-allowed" : "pointer",
                opacity: readOnly ? 0.5 : 1,
                color: current === opt.value ? "#3b82f6" : "#6b7280",
              }}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </Label>
    );
  },
});
