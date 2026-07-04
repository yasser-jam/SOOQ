import React from "react";
import { ComponentConfig } from "@/core/types";
import { withLayout } from "../../components/Layout";
import {
  STORE_CART_KEY,
  type CartSectionResourceMetadata,
} from "../../cart/store-cart";
import { CartListClient } from "./CartListClient";
import type { CartListProps } from "./types";

export type { CartListProps };

const DEFAULT_METADATA: CartSectionResourceMetadata = {
  dataSource: "localStorage",
  storageKey: STORE_CART_KEY,
};

const CartListInner: ComponentConfig<CartListProps> = {
  label: "قائمة السلة",

  fields: {
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
    gap: "md",
    showDividerLines: true,
    metadata: DEFAULT_METADATA,
  },

  resolveData: ({ props }) => {
    const current = props.metadata;
    if (
      current?.dataSource === DEFAULT_METADATA.dataSource &&
      current?.storageKey === DEFAULT_METADATA.storageKey
    ) {
      return {};
    }
    return { props: { metadata: DEFAULT_METADATA } };
  },

  render: (props) => <CartListClient {...props} />,
};

export const CartList = withLayout(CartListInner);
