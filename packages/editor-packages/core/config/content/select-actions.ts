/** Serialized on select props as `selectAction`. */

export const SELECT_ACTIONS = [
  "return_item_condition",
  "checkout_address",
  "checkout_payment_method",
] as const;

export type SelectAction = (typeof SELECT_ACTIONS)[number];

/**
 * Actions whose `<option>` list comes from the store runtime instead of a
 * static `ENUM_MAPS` entry. In the editor these render sample rows so the
 * merchant sees a populated control.
 */
export type BoundSelectAction = "checkout_address" | "checkout_payment_method";

export function isBoundSelectAction(
  action: SelectAction | "" | undefined
): action is BoundSelectAction {
  return action === "checkout_address" || action === "checkout_payment_method";
}

const SELECT_ACTION_LABELS: Record<SelectAction, string> = {
  return_item_condition: "حالة منتج الإرجاع",
  checkout_address: "الدفع: عنوان التوصيل",
  checkout_payment_method: "الدفع: طريقة الدفع",
};

export const SELECT_ACTION_OPTIONS: { label: string; value: SelectAction }[] =
  SELECT_ACTIONS.map((action) => ({
    label: SELECT_ACTION_LABELS[action],
    value: action,
  }));

export function selectActionLabel(action: SelectAction): string {
  return SELECT_ACTION_LABELS[action];
}
