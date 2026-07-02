import React from "react";
import { ComponentConfig } from "@/core/types";
import { spacingOptions } from "../../options";
import { resolveColor, colorField } from "../../content/color-fields";
import {
  RADIUS_OPTIONS,
  resolveRadius,
} from "../../content/typography-fields";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import { withLayout } from "../../components/Layout";
import type { RowGroupProps } from "./types";

const RowGroupInner: ComponentConfig<RowGroupProps> = {
  label: "صف أفقي",

  fields: {
    gap: {
      type: "number",
      label: "الفجوة (بكسل)",
      min: 0,
      max: 120,
    },
    alignItems: {
      type: "select",
      label: "محاذاة العناصر",
      options: [
        { label: "Start", value: "flex-start" },
        { label: "Center", value: "center" },
        { label: "End", value: "flex-end" },
        { label: "Stretch", value: "stretch" },
        { label: "Baseline", value: "baseline" },
      ],
    },
    justifyContent: {
      type: "select",
      label: "محاذاة المحتوى",
      options: [
        { label: "Start", value: "flex-start" },
        { label: "Center", value: "center" },
        { label: "End", value: "flex-end" },
        { label: "Space Between", value: "space-between" },
        { label: "Space Around", value: "space-around" },
        { label: "Space Evenly", value: "space-evenly" },
      ],
    },
    wrap: {
      type: "radio",
      label: "التفاف",
      options: [
        { label: "Wrap", value: "wrap" },
        { label: "No Wrap", value: "nowrap" },
      ],
    },
    backgroundColor: { ...colorField, label: "لون الخلفية" },
    padding: {
      type: "select",
      label: "الحشو الداخلي",
      options: [{ label: "0px", value: "0px" }, ...spacingOptions],
    },
    borderRadius: themeFixedSelectField({
      label: "زاوية الحدود",
      themeOptions: RADIUS_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
    content: {
      type: "slot",
      disallow: ["Section"],
    },
  },

  defaultProps: {
    gap: 16,
    alignItems: "center",
    justifyContent: "flex-start",
    wrap: "nowrap",
    backgroundColor: "",
    padding: "0px",
    borderRadius: "theme-none",
    content: [],
  },

  render: ({
    gap,
    alignItems,
    justifyContent,
    wrap,
    backgroundColor,
    padding,
    borderRadius,
    content: Content,
  }) => {
    const bg = (backgroundColor ?? "").trim();
    const pad = padding && padding !== "0px" ? padding : undefined;
    const radius = resolveRadius(borderRadius ?? "theme-none");

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap,
          alignItems,
          justifyContent,
          flexWrap: wrap,
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          ...(bg ? { backgroundColor: resolveColor(bg) } : {}),
          ...(pad ? { padding: pad } : {}),
          ...(radius && radius !== "0" ? { borderRadius: radius } : {}),
        }}
      >
        <Content
          style={{
            display: "flex",
            flexDirection: "row",
            gap,
            alignItems,
            justifyContent,
            flexWrap: wrap,
            width: "100%",
            minWidth: 0,
          }}
        />
      </div>
    );
  },
};

export const RowGroup = withLayout(RowGroupInner);
