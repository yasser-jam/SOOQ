import React from "react";
import { ComponentConfig } from "@/core/types";
import { withLayout } from "../../components/Layout";
import {
  STORE_CART_KEY,
  type CartSectionResourceMetadata,
} from "../../cart/store-cart";
import { CartSectionClient } from "./CartSectionClient";
import { resolveMetadataProp } from "../../lib/resolve-metadata-prop";
import type { CartSectionProps } from "./types";

export type { CartSectionProps };

const DEFAULT_METADATA: CartSectionResourceMetadata = {
  dataSource: "localStorage",
  storageKey: STORE_CART_KEY,
};

const CartSectionInner: ComponentConfig<CartSectionProps> = {
  label: "قسم السلة",

  fields: {
    layoutStyle: {
      type: "radio",
      label: "التخطيط",
      options: [
        { label: "صفوف", value: "rows" },
        { label: "بطاقات", value: "cards" },
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
    orderButtonLabel: {
      type: "text",
      label: "نص زر الطلب",
    },
  },

  defaultProps: {
    layoutStyle: "rows",
    gap: "md",
    showDividerLines: true,
    orderButtonLabel: "إتمام الطلب",
    metadata: DEFAULT_METADATA,
  },

  resolveData: ({ props }) =>
    resolveMetadataProp(props.metadata, DEFAULT_METADATA),

  render: (props) => <CartSectionClient {...props} />,
};

export const CartSection = withLayout(CartSectionInner);
