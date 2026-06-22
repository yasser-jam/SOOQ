"use client";
import React from "react";
import { Smartphone, Tablet, Monitor } from "lucide-react";

export type VisibilityValue = {
  showOnMobile: boolean;
  showOnTablet: boolean;
  showOnDesktop: boolean;
};

const defaultVisibility: VisibilityValue = {
  showOnMobile: true,
  showOnTablet: true,
  showOnDesktop: true,
};

function VisibilityToggleRender({
  value,
  onChange,
  readOnly,
}: {
  field: any;
  value: VisibilityValue;
  onChange: (value: VisibilityValue) => void;
  readOnly?: boolean;
}) {
  const v = value ?? defaultVisibility;

  const toggle = (key: keyof VisibilityValue) => {
    onChange({ ...v, [key]: !v[key] });
  };

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 32,
    border: active ? "2px solid #3b82f6" : "1px solid #d1d5db",
    borderRadius: 6,
    background: active ? "#eff6ff" : "#ffffff",
    cursor: readOnly ? "not-allowed" : "pointer",
    opacity: readOnly ? 0.5 : 1,
    color: active ? "#3b82f6" : "#6b7280",
  });

  return (
    <div>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>الظهور على</div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          style={buttonStyle(v.showOnMobile)}
          onClick={() => toggle("showOnMobile")}
          disabled={readOnly}
          title="جوال"
        >
          <Smartphone size={16} />
        </button>
        <button
          type="button"
          style={buttonStyle(v.showOnTablet)}
          onClick={() => toggle("showOnTablet")}
          disabled={readOnly}
          title="جهاز لوحي"
        >
          <Tablet size={16} />
        </button>
        <button
          type="button"
          style={buttonStyle(v.showOnDesktop)}
          onClick={() => toggle("showOnDesktop")}
          disabled={readOnly}
          title="حاسوب"
        >
          <Monitor size={16} />
        </button>
      </div>
    </div>
  );
}

export const visibilityField: any = {
  type: "custom",
  label: "الرؤية",
  render: (props: any) => <VisibilityToggleRender {...props} />,
};
