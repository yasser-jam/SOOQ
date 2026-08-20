/** Serialized on dropdown props as `dropdownAction`. */

export const DROPDOWN_ACTIONS = [
  "select_variant",
  "filter_category",
  "checkout_address",
  "checkout_payment_method",
  "return_item_condition",
] as const;

export type DropdownAction = (typeof DROPDOWN_ACTIONS)[number];

const DROPDOWN_ACTION_LABELS: Record<DropdownAction, string> = {
  select_variant: "اختيار متغيّر المنتج",
  filter_category: "تصفية: التصنيف",
  checkout_address: "الدفع: عنوان التوصيل",
  checkout_payment_method: "الدفع: طريقة الدفع",
  return_item_condition: "حالة منتج الإرجاع",
};

export const DROPDOWN_ACTION_OPTIONS: { label: string; value: DropdownAction }[] =
  DROPDOWN_ACTIONS.map((action) => ({
    label: DROPDOWN_ACTION_LABELS[action],
    value: action,
  }));

export function dropdownActionLabel(action: DropdownAction): string {
  return DROPDOWN_ACTION_LABELS[action];
}

/**
 * Actions whose `<option>` list comes from the store runtime instead of a static source
 * (`options[]` or `ENUM_MAPS`). Mirrors `isBoundSelectAction` from the retired `ContentSelect`
 * block — used to hide the block entirely when the list resolves empty (e.g. no saved address
 * yet), instead of showing a picker with nothing to pick.
 */
export type BoundDropdownAction = "checkout_address" | "checkout_payment_method";

export function isBoundDropdownAction(
  action: DropdownAction | "" | undefined
): action is BoundDropdownAction {
  return action === "checkout_address" || action === "checkout_payment_method";
}
