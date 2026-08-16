/** Serialized on dropdown props as `dropdownAction`. */

export const DROPDOWN_ACTIONS = ["select_variant", "filter_category"] as const;

export type DropdownAction = (typeof DROPDOWN_ACTIONS)[number];

const DROPDOWN_ACTION_LABELS: Record<DropdownAction, string> = {
  select_variant: "اختيار متغيّر المنتج",
  filter_category: "تصفية: التصنيف",
};

export const DROPDOWN_ACTION_OPTIONS: { label: string; value: DropdownAction }[] =
  DROPDOWN_ACTIONS.map((action) => ({
    label: DROPDOWN_ACTION_LABELS[action],
    value: action,
  }));

export function dropdownActionLabel(action: DropdownAction): string {
  return DROPDOWN_ACTION_LABELS[action];
}
