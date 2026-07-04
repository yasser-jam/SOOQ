import type { ComponentConfig } from "@/core/types";
import { Group, type GroupProps } from "../Group";
import { createCartItemGroup } from "../../presets/cart";

const groupConfig = Group as ComponentConfig<GroupProps>;
const presetProps = createCartItemGroup().props as Partial<GroupProps>;

export type CartItemProps = GroupProps;

/** Cart line preset — a bound Group with image, title, price, and quantity stepper. */
export const CartItem: ComponentConfig<GroupProps> = {
  ...groupConfig,
  label: "عنصر السلة",
  defaultProps: {
    ...groupConfig.defaultProps,
    ...presetProps,
    layout: {
      grow: true,
      spanCol: 1,
      spanRow: 1,
      padding: "0px",
    },
  },
};
