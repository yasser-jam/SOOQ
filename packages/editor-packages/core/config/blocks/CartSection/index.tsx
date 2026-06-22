import React from "react";
import { ComponentConfig } from "@/core/types";
import { withLayout } from "../../components/Layout";
import { CartSectionClient } from "./CartSectionClient";
import type { CartSectionProps } from "./types";

export type { CartSectionProps };

const CartSectionInner: ComponentConfig<CartSectionProps> = {
  label: "Cart Section",

  fields: {
    layoutStyle: {
      type: "radio",
      label: "التخطيط",
      options: [
        { label: "Rows", value: "rows" },
        { label: "Cards", value: "cards" },
      ],
    },
    gap: {
      type: "select",
      label: "الفجوة بين العناصر",
      options: [
        { label: "Small (8px)", value: "sm" },
        { label: "Medium (16px)", value: "md" },
        { label: "Large (24px)", value: "lg" },
        { label: "Extra large (32px)", value: "xl" },
      ],
    },
    showDividerLines: {
      type: "radio",
      label: "خطوط الفصل",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
  },

  defaultProps: {
    layoutStyle: "rows",
    gap: "md",
    showDividerLines: true,
  },

  render: (props) => <CartSectionClient {...props} />,
};

export const CartSection = withLayout(CartSectionInner);
