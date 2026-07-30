/** Serialized on input props as `inputAction`. */

export const INPUT_ACTIONS = [
  "search_products",
  "filter_min_price",
  "filter_max_price",
] as const;

export type InputAction = (typeof INPUT_ACTIONS)[number];

/** Price-filter actions read/write numbers and clear the filter when emptied. */
export type PriceFilterInputAction = "filter_min_price" | "filter_max_price";

const INPUT_ACTION_LABELS: Record<InputAction, string> = {
  search_products: "بحث المنتجات",
  filter_min_price: "تصفية: أقل سعر",
  filter_max_price: "تصفية: أعلى سعر",
};

export const INPUT_ACTION_OPTIONS: { label: string; value: InputAction }[] =
  INPUT_ACTIONS.map((action) => ({
    label: INPUT_ACTION_LABELS[action],
    value: action,
  }));

export function isPriceFilterInputAction(
  action: InputAction | "" | undefined
): action is PriceFilterInputAction {
  return action === "filter_min_price" || action === "filter_max_price";
}

export function inputActionLabel(action: InputAction): string {
  return INPUT_ACTION_LABELS[action];
}
