// ─── Mobile tab-bar icon allow-list ────────────────────────────────────────
// Values the mobile engine actually accepts for `navigation.tabs[].icon`
// (supported-icons.md categories أ "safe everywhere" + ب "tabs/app bar only").
// A name outside this list doesn't error — the engine renders a silent
// placeholder glyph instead — so the page-settings UI must only ever offer
// values from here, never a raw Material Icons name.

export type MobileTabIconOption = { value: string; label: string };

export const MOBILE_TAB_ICON_OPTIONS: MobileTabIconOption[] = [
  // (أ) safe everywhere
  { value: "home", label: "الرئيسية" },
  { value: "grid_view", label: "شبكة" },
  { value: "search", label: "بحث" },
  { value: "shopping_cart", label: "سلة التسوق" },
  { value: "shopping_bag", label: "حقيبة التسوق" },
  { value: "person", label: "شخص" },
  { value: "account_circle", label: "حساب" },
  { value: "favorite", label: "مفضلة" },
  { value: "local_offer", label: "عرض" },
  { value: "notifications", label: "إشعارات" },
  { value: "settings", label: "إعدادات" },
  { value: "list", label: "قائمة" },
  { value: "close", label: "إغلاق" },
  { value: "delete", label: "حذف" },
  { value: "edit", label: "تعديل" },
  // (ب) valid only in tabs / app bar
  { value: "store", label: "متجر" },
  { value: "category", label: "الأقسام" },
  { value: "inventory", label: "المخزون" },
  { value: "receipt", label: "فاتورة" },
  { value: "view_list", label: "عرض قائمة" },
  { value: "info", label: "معلومات" },
  { value: "image", label: "صورة" },
  { value: "videocam", label: "فيديو" },
  { value: "star", label: "نجمة" },
  { value: "star_outline", label: "نجمة (تحديد)" },
  { value: "share", label: "مشاركة" },
  { value: "menu", label: "القائمة الجانبية" },
  { value: "add", label: "إضافة" },
  { value: "play_circle", label: "تشغيل" },
  { value: "arrow_back", label: "سهم للخلف" },
  { value: "arrow_forward", label: "سهم للأمام" },
  { value: "back", label: "رجوع" },
  { value: "favorite_outline", label: "مفضلة (تحديد)" },
  { value: "home_outlined", label: "الرئيسية (تحديد)" },
  { value: "person_outline", label: "شخص (تحديد)" },
  { value: "notifications_outlined", label: "إشعارات (تحديد)" },
  { value: "shopping_cart_outlined", label: "سلة التسوق (تحديد)" },
];

/** Fallback used when a page has no authored icon yet. */
export const DEFAULT_MOBILE_TAB_ICON = "list";

export const isValidMobileTabIcon = (value: unknown): value is string =>
  typeof value === "string" && MOBILE_TAB_ICON_OPTIONS.some((option) => option.value === value);
