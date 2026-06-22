import React from "react";
import { ComponentConfig } from "@/core/types";
import { withLayout } from "../../components/Layout";
import { CategoryListMenuClient } from "./CategoryListMenuClient";
import type { CategoryListMenuProps } from "./types";

export type { CategoryListMenuProps };

const CategoryListMenuInner: ComponentConfig<CategoryListMenuProps> = {
  label: "Category list menu",

  fields: {
    buttonLabel: { type: "text", label: "نص الزر" },
    categoriesMenuTitle: { type: "text", label: "عنوان شاشة الفئات" },
    backLabel: { type: "text", label: "زر الرجوع (إمكانية الوصول)" },
    maxProducts: {
      type: "number",
      label: "الحد الأقصى للمنتجات لكل فئة (0 = الكل)",
      min: 0,
    },
  },

  defaultProps: {
    buttonLabel: "Browse categories",
    categoriesMenuTitle: "Shop by category",
    backLabel: "Back to categories",
    maxProducts: 24,
  },

  render: (props) => <CategoryListMenuClient {...props} />,
};

export const CategoryListMenu = withLayout(CategoryListMenuInner);
