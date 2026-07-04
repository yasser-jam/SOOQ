import React from "react";
import { ComponentConfig } from "@/core/types";
import { WithLayout, withLayout } from "../../components/Layout";
import { CartQuantityClient } from "./CartQuantityClient";

export type CartQuantityProps = WithLayout<{
  align: "left" | "center" | "right";
}>;

const CartQuantityInner: ComponentConfig<CartQuantityProps> = {
  label: "كمية السلة",

  fields: {
    align: {
      type: "radio",
      label: "المحاذاة",
      options: [
        { label: "يمين", value: "right" },
        { label: "وسط", value: "center" },
        { label: "يسار", value: "left" },
      ],
    },
  },

  defaultProps: {
    align: "right",
  },

  render: ({ align, puck }) => (
    <CartQuantityClient
      align={align ?? "right"}
      isEditing={puck?.isEditing === true}
    />
  ),
};

export const CartQuantity = withLayout(CartQuantityInner);
