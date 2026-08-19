import React from "react";
import { ComponentConfig } from "@/core/types";
import { withLayout } from "../../components/Layout";
import { colorField } from "../../content/color-fields";
import { TEXT_SIZE_OPTIONS } from "../../content/typography-fields";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import { CategoryTreeClient } from "./CategoryTreeClient";
import type { CategoryTreeProps } from "./types";

export type { CategoryTreeProps };

const CategoryTreeInner: ComponentConfig<CategoryTreeProps> = {
  label: "شجرة الفئات",
  fields: {
    textColor: { ...colorField, label: "لون النص" },
    activeColor: { ...colorField, label: "لون الفئة المحددة" },
    fontSize: themeFixedSelectField({
      label: "حجم الخط",
      themeOptions: TEXT_SIZE_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
    gap: {
      type: "number",
      label: "المسافة بين الفئات",
      min: 0,
    },
    indentStep: {
      type: "number",
      label: "إزاحة الفئات الفرعية (بكسل)",
      min: 0,
    },
    showProductCount: {
      type: "radio",
      label: "إظهار عدد المنتجات",
      options: [
        { label: "نعم", value: true },
        { label: "لا", value: false },
      ],
    },
  },
  defaultProps: {
    textColor: "theme-text",
    activeColor: "theme-primary",
    fontSize: "theme-md",
    gap: 4,
    indentStep: 16,
    showProductCount: false,
  },
  render: (props) => <CategoryTreeClient {...props} />,
};

export const CategoryTree = withLayout(CategoryTreeInner);
