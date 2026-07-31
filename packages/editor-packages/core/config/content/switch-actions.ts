/** Serialized on switch props as `switchAction`. */

export const SWITCH_ACTIONS = [
  "filter_in_stock_only",
  "marketing_email_opt_in",
  "marketing_sms_opt_in",
  "address_is_default",
] as const;

export type SwitchAction = (typeof SWITCH_ACTIONS)[number];

const SWITCH_ACTION_LABELS: Record<SwitchAction, string> = {
  filter_in_stock_only: "تصفية: المتوفر فقط",
  marketing_email_opt_in: "التسويق: البريد الإلكتروني",
  marketing_sms_opt_in: "التسويق: الرسائل النصية",
  address_is_default: "العنوان: تعيين كافتراضي",
};

export const SWITCH_ACTION_OPTIONS: { label: string; value: SwitchAction }[] =
  SWITCH_ACTIONS.map((action) => ({
    label: SWITCH_ACTION_LABELS[action],
    value: action,
  }));

export function switchActionLabel(action: SwitchAction): string {
  return SWITCH_ACTION_LABELS[action];
}
