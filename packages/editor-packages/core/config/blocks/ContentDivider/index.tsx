import React from "react";
import { ComponentConfig } from "@/core/types";
import { WithLayout, withLayout } from "../../components/Layout";
import { colorVar, ColorKey, COLOR_KEYS } from "../../theme";

const COLOR_SELECT = COLOR_KEYS.map(({ key, label }) => ({ label, value: key }));

export type ContentDividerProps = WithLayout<{
  thickness: string;
  colorMode: "theme" | "fixed";
  colorTheme: ColorKey;
  colorFixed: string;
}>;

const ContentDividerInner: ComponentConfig<ContentDividerProps> = {
  label: "فاصل",
  fields: {
    thickness: { type: "text", label: "السماكة" },
    colorMode: {
      type: "radio",
      label: "اللون",
      options: [
        { label: "Theme", value: "theme" },
        { label: "Fixed", value: "fixed" },
      ],
    },
    colorTheme: { type: "select", options: COLOR_SELECT },
    colorFixed: { type: "text", label: "اللون (hex)" },
  },
  defaultProps: {
    thickness: "1px",
    colorMode: "theme",
    colorTheme: "neutral",
    colorFixed: "#e5e7eb",
  },
  render: ({ thickness, colorMode, colorTheme, colorFixed }) => {
    const color =
      colorMode === "theme" ? `var(${colorVar(colorTheme)})` : colorFixed;
    return (
      <hr
        style={{
          border: "none",
          height: thickness,
          background: color,
          margin: 0,
          width: "100%",
        }}
      />
    );
  },
};

export const ContentDivider = withLayout(ContentDividerInner);
