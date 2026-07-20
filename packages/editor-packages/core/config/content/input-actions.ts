/** Serialized on input props as `inputAction`. */

export const INPUT_ACTIONS = ["search_products"] as const;

export type InputAction = (typeof INPUT_ACTIONS)[number];

export const INPUT_ACTION_OPTIONS: { label: string; value: InputAction }[] = [
  { label: "بحث المنتجات", value: "search_products" },
];

export function inputActionLabel(action: InputAction): string {
  const map: Record<InputAction, string> = {
    search_products: "بحث المنتجات",
  };
  return map[action];
}
