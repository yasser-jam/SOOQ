import type { ComponentConfig } from "@/core/types";
import { Group, type GroupProps } from "../Group";
import { createProductCardGroup } from "../../presets/products-grid";

const groupConfig = Group as ComponentConfig<GroupProps>;
const presetProps = createProductCardGroup().props as Partial<GroupProps>;

export type ProductCardProps = GroupProps;

/** Product card preset — a bound Group with image, title, price, and actions. */
export const ProductCard: ComponentConfig<GroupProps> = {
  ...groupConfig,
  label: "بطاقة منتج",
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
