"use client"

import React from "react"
import { getClassNameFactory } from "@/core/lib"
import styles from "./styles.module.css"
import type { SettingsRootProps } from "./index"
import { DEFAULT_BUTTON_VARIANTS } from "../../../theme"

const getClassName = getClassNameFactory("SettingsPanel", styles)

const VARIANTS = [
  { key: "primary" as const, label: "أساسي" },
  { key: "secondary" as const, label: "ثانوي" },
  { key: "error" as const, label: "خطأ" },
];

export default function ButtonVariantsBlock({ rootProps, updateProps }: { rootProps?: SettingsRootProps; updateProps: (p: Partial<SettingsRootProps>) => void }) {
  return (
    <div className={getClassName("section")}>
      <div className={getClassName("sectionTitle")}>أنماط الأزرار</div>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
        اختر ألوان الخلفية والنص لكل نمط من أنماط الأزرار
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {VARIANTS.map(({ key, label }) => {
          const defaults = DEFAULT_BUTTON_VARIANTS[key];
          const capKey = key.charAt(0).toUpperCase() + key.slice(1);
          const bgValue = (rootProps as any)?.[`buttonVariant${capKey}Bg`] ?? defaults.bg;
          const fgValue = (rootProps as any)?.[`buttonVariant${capKey}Fg`] ?? defaults.fg;
          const radiusValue = (rootProps as any)?.[`buttonVariant${capKey}Radius`] ?? defaults.radius;
          const sizeValue = (rootProps as any)?.[`buttonVariant${capKey}Size`] ?? defaults.size;

          const updateBg = (v: string) => updateProps({ [`buttonVariant${capKey}Bg`]: v } as any);
          const updateFg = (v: string) => updateProps({ [`buttonVariant${capKey}Fg`]: v } as any);
          const updateRadius = (v: string) => updateProps({ [`buttonVariant${capKey}Radius`]: v } as any);
          const updateSize = (v: string) => updateProps({ [`buttonVariant${capKey}Size`]: v } as any);

          return (
            <div key={key} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{label}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>لون الخلفية</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="color"
                      value={bgValue}
                      onChange={(e) => updateBg(e.target.value)}
                      style={{ width: 36, height: 28, padding: 0, border: "none", cursor: "pointer", background: "transparent" }}
                    />
                    <input
                      type="text"
                      value={bgValue}
                      onChange={(e) => updateBg(e.target.value)}
                      style={{ flex: 1, padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13, fontFamily: "monospace" }}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>لون النص</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="color"
                      value={fgValue}
                      onChange={(e) => updateFg(e.target.value)}
                      style={{ width: 36, height: 28, padding: 0, border: "none", cursor: "pointer", background: "transparent" }}
                    />
                    <input
                      type="text"
                      value={fgValue}
                      onChange={(e) => updateFg(e.target.value)}
                      style={{ flex: 1, padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13, fontFamily: "monospace" }}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>نصف القطر (px)</div>
                  <input
                    type="number"
                    min={0}
                    max={32}
                    value={parseInt(radiusValue, 10)}
                    onChange={(e) => updateRadius(e.target.value === "" ? "0" : `${parseInt(e.target.value, 10)}px`)}
                    style={{ width: "100%", padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>الحجم</div>
                  <select
                    value={sizeValue}
                    onChange={(e) => updateSize(e.target.value)}
                    style={{ width: "100%", padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13 }}
                  >
                    <option value="sm">صغير</option>
                    <option value="md">متوسط</option>
                    <option value="lg">كبير</option>
                  </select>
                </div>
                <div
                  style={{
                    marginTop: 4,
                    padding: sizeValue === "sm" ? "6px 14px" : sizeValue === "lg" ? "12px 26px" : "9px 18px",
                    borderRadius: radiusValue,
                    background: bgValue,
                    color: fgValue,
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: sizeValue === "sm" ? 13 : sizeValue === "lg" ? 15 : 14,
                  }}
                >
                  معاينة: {label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
