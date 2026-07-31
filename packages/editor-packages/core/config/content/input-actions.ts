/** Serialized on input props as `inputAction`. */

export const INPUT_ACTIONS = [
  "search_products",
  "filter_min_price",
  "filter_max_price",
  "profile_full_name",
  "address_label",
  "address_recipient_name",
  "address_recipient_phone",
  "address_governorate",
  "address_city",
  "address_street",
  "address_notes",
] as const;

export type InputAction = (typeof INPUT_ACTIONS)[number];

/** Price-filter actions read/write numbers and clear the filter when emptied. */
export type PriceFilterInputAction = "filter_min_price" | "filter_max_price";

/** Address draft actions write to `customer.addressDraft`. */
export type AddressDraftInputAction =
  | "address_label"
  | "address_recipient_name"
  | "address_recipient_phone"
  | "address_governorate"
  | "address_city"
  | "address_street"
  | "address_notes";

export const ADDRESS_DRAFT_FIELD_BY_ACTION = {
  address_label: "label",
  address_recipient_name: "recipientName",
  address_recipient_phone: "recipientPhone",
  address_governorate: "governorate",
  address_city: "city",
  address_street: "streetAddress",
  address_notes: "notes",
} as const satisfies Record<
  AddressDraftInputAction,
  keyof import("../store-context").CustomerAddressDraft
>;

const INPUT_ACTION_LABELS: Record<InputAction, string> = {
  search_products: "بحث المنتجات",
  filter_min_price: "تصفية: أقل سعر",
  filter_max_price: "تصفية: أعلى سعر",
  profile_full_name: "الملف: الاسم الكامل",
  address_label: "العنوان: التسمية",
  address_recipient_name: "العنوان: اسم المستلم",
  address_recipient_phone: "العنوان: هاتف المستلم",
  address_governorate: "العنوان: المحافظة",
  address_city: "العنوان: المدينة",
  address_street: "العنوان: الشارع",
  address_notes: "العنوان: ملاحظات",
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

export function isAddressDraftInputAction(
  action: InputAction | "" | undefined
): action is AddressDraftInputAction {
  return action in ADDRESS_DRAFT_FIELD_BY_ACTION;
}

export function inputActionLabel(action: InputAction): string {
  return INPUT_ACTION_LABELS[action];
}
