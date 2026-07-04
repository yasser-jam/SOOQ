import type { ComponentConfig } from "@/core/types";
import { Group, type GroupProps } from "../Group";
import { createCartItemGroup } from "../../presets/cart";

const groupConfig = Group as ComponentConfig<GroupProps>;
const presetProps = createCartItemGroup().props as Partial<GroupProps>;

/** @deprecated Legacy alias — cart rows use Group + `cartLineId` via presets. */
export type CartItemProps = GroupProps;

export const CartItem: ComponentConfig<GroupProps> = {
  ...groupConfig,
  label: "عنصر السلة (قديم)",
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
