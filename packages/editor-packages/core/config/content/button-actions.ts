/** Serialized on button props as `buttonAction` (e.g. in page JSON). */

export const BUTTON_ACTIONS = [
  "link",
  "login",
  "logout",
  "addToCart",
  "addToWishlist",
  "makeOrder",
  "verifyOtp",
] as const;

export type ButtonAction = (typeof BUTTON_ACTIONS)[number];

export const BUTTON_ACTION_OPTIONS: { label: string; value: ButtonAction }[] = [
  { label: "رابط", value: "link" },
  { label: "تسجيل الدخول", value: "login" },
  { label: "تسجيل الخروج", value: "logout" },
  { label: "إضافة إلى السلة", value: "addToCart" },
  { label: "إضافة إلى المفضلة", value: "addToWishlist" },
  { label: "إتمام الطلب", value: "makeOrder" },
  { label: "تحقق من الرمز", value: "verifyOtp" },
];

export const BUTTON_FUNCTIONAL_ACTION_OPTIONS = BUTTON_ACTION_OPTIONS.filter(
  (o) => o.value !== "link"
);

/** Human-readable name for demos / alerts. */
export function buttonActionLabel(action: ButtonAction): string {
  const map: Record<ButtonAction, string> = {
    link: "رابط",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    addToCart: "إضافة إلى السلة",
    addToWishlist: "إضافة إلى المفضلة",
    makeOrder: "إتمام الطلب",
    verifyOtp: "تحقق من الرمز",
  };
  return map[action];
}
