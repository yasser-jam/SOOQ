import React, { useMemo } from "react";
import { Palette } from "lucide-react";
import { getClassNameFactory } from "@/core/lib";
import { THEME_PRESETS, themeDemoEditPath } from "../../../theme-presets";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ThemesPanel", styles);

export function ThemesPanel() {
  const activeThemeId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const path = window.location.pathname.replace(/\/edit$/, "") || "/";
    const m = path.match(/^\/themes\/([^/]+)$/);
    return m ? m[1] : null;
  }, []);

  return (
    <div className={getClassName()}>
      <div className={getClassName("header")}>Themes</div>
      <p className={getClassName("intro")}>
        Try a complete visual direction. Open a preset, then adjust fonts and
        colors in Settings if you want a custom finish.
      </p>

      <div className={getClassName("gallery")}>
        <a href="/themes/edit" className={getClassName("galleryLink")}>
          <Palette size={18} />
          Theme gallery
        </a>
      </div>

      <div className={getClassName("list")}>
        {THEME_PRESETS.map((preset) => {
          const href = themeDemoEditPath(preset.id);
          const active = activeThemeId === preset.id;
          return (
            <a
              key={preset.id}
              href={href}
              className={`${getClassName("item")} ${active ? getClassName("item--active") : ""}`}
            >
              <span
                className={getClassName("swatch")}
                style={{ background: preset.previewColor }}
                title={preset.label}
              />
              <div className={getClassName("text")}>
                <div className={getClassName("label")}>{preset.label}</div>
                <div className={getClassName("desc")}>{preset.description}</div>
              </div>
            </a>
          );
        })}
      </div>

      <p className={getClassName("hint")}>
        Each preset opens a dedicated demo page (e.g. /themes/ocean) with its own
        saved content. Tune fonts and colours in Settings.
      </p>
    </div>
  );
}
