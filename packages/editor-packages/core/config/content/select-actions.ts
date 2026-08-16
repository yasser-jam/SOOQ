/** Serialized on select props as `selectAction`. */

export const SELECT_ACTIONS = ["return_item_condition"] as const;

export type SelectAction = (typeof SELECT_ACTIONS)[number];

const SELECT_ACTION_LABELS: Record<SelectAction, string> = {
  return_item_condition: "حالة منتج الإرجاع",
};

export const SELECT_ACTION_OPTIONS: { label: string; value: SelectAction }[] =
  SELECT_ACTIONS.map((action) => ({
    label: SELECT_ACTION_LABELS[action],
    value: action,
  }));

export function selectActionLabel(action: SelectAction): string {
  return SELECT_ACTION_LABELS[action];
}
