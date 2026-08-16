/** Serialized on button props as `buttonAction` (e.g. in page JSON). */

export const BUTTON_ACTIONS = [
  "link",
  "login",
  "logout",
  "addToCart",
  "addToWishlist",
  "makeOrder",
  "verifyOtp",
  "cartQtyIncrease",
  "cartQtyDecrease",
  "saveProfile",
  "createAddress",
  "setDefaultAddress",
  "deleteAddress",
  "toggleLanguage",
  "ordersNextPage",
  "ordersPrevPage",
  "downloadInvoice",
  "cancelOrder",
  "submitReturn",
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
  { label: "زيادة الكمية", value: "cartQtyIncrease" },
  { label: "تقليل الكمية", value: "cartQtyDecrease" },
  { label: "حفظ الملف الشخصي", value: "saveProfile" },
  { label: "حفظ العنوان", value: "createAddress" },
  { label: "تعيين كعنوان افتراضي", value: "setDefaultAddress" },
  { label: "حذف العنوان", value: "deleteAddress" },
  { label: "تبديل اللغة", value: "toggleLanguage" },
  { label: "الصفحة التالية للطلبات", value: "ordersNextPage" },
  { label: "الصفحة السابقة للطلبات", value: "ordersPrevPage" },
  { label: "تحميل الفاتورة", value: "downloadInvoice" },
  { label: "إلغاء الطلب", value: "cancelOrder" },
  { label: "إرسال طلب الإرجاع", value: "submitReturn" },
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
    cartQtyIncrease: "زيادة الكمية",
    cartQtyDecrease: "تقليل الكمية",
    saveProfile: "حفظ الملف الشخصي",
    createAddress: "حفظ العنوان",
    setDefaultAddress: "تعيين كعنوان افتراضي",
    deleteAddress: "حذف العنوان",
    toggleLanguage: "تبديل اللغة",
    ordersNextPage: "الصفحة التالية",
    ordersPrevPage: "الصفحة السابقة",
    downloadInvoice: "تحميل الفاتورة",
    cancelOrder: "إلغاء الطلب",
    submitReturn: "طلب إرجاع المنتجات",
  };
  return map[action];
}
