import type { ComponentDataOptionalId } from "@/core/types";
import type { SitePage } from "../lib/site-data";
import { createRawaqThemeWalk } from "./rawaq-theme-walk";
import { createCheckoutPageContent } from "./checkout";

/**
 * Rawaq (روّاق) styling layer over the shared `/checkout` preset.
 * Styling rules live in `./rawaq-theme-walk`; this file owns the translations
 * and the SitePage wrapper. Mirrors `orders-rawaq.ts`.
 */

const BILINGUAL: Record<string, { ar: string; en: string }> = {
  "سجّل دخولك لإتمام الطلب.": {
    ar: "سجّل دخولك لإتمام الطلب.",
    en: "Sign in to complete your order.",
  },
  "نحتاج رقم هاتفك وعنوان التوصيل قبل تأكيد الطلب.": {
    ar: "نحتاج رقم هاتفك وعنوان التوصيل قبل تأكيد الطلب.",
    en: "We need your phone number and delivery address before confirming.",
  },
  "تسجيل الدخول": { ar: "تسجيل الدخول", en: "Sign in" },
  "تم استلام طلبك": { ar: "تم استلام طلبك", en: "Your order was received" },
  "سنتواصل معك لتأكيد موعد التوصيل. يمكنك متابعة الطلب من صفحة طلباتي.": {
    ar: "سنتواصل معك لتأكيد موعد التوصيل. يمكنك متابعة الطلب من صفحة طلباتي.",
    en: "We'll contact you to confirm delivery. Track it from My orders.",
  },
  "عرض طلباتي": { ar: "عرض طلباتي", en: "View my orders" },
  "عنوان التوصيل": { ar: "عنوان التوصيل", en: "Delivery address" },
  "اختر عنوان التوصيل": {
    ar: "اختر عنوان التوصيل",
    en: "Choose a delivery address",
  },
  "لا يوجد عنوان محفوظ. أضف عنوانك من صفحة الحساب أولاً.": {
    ar: "لا يوجد عنوان محفوظ. أضف عنوانك من صفحة الحساب أولاً.",
    en: "No saved address yet. Add one from your account page first.",
  },
  "إدارة العناوين": { ar: "إدارة العناوين", en: "Manage addresses" },
  "طريقة الدفع": { ar: "طريقة الدفع", en: "Payment method" },
  "اختر طريقة الدفع": {
    ar: "اختر طريقة الدفع",
    en: "Choose a payment method",
  },
  "ملخّص الطلب": { ar: "ملخّص الطلب", en: "Order summary" },
  "المجموع الفرعي": { ar: "المجموع الفرعي", en: "Subtotal" },
  "تكلفة الشحن": { ar: "تكلفة الشحن", en: "Shipping" },
  الإجمالي: { ar: "الإجمالي", en: "Total" },
  "تأكيد الطلب": { ar: "تأكيد الطلب", en: "Confirm order" },
  "اختر عنوان التوصيل وطريقة الدفع لتتمكن من تأكيد الطلب.": {
    ar: "اختر عنوان التوصيل وطريقة الدفع لتتمكن من تأكيد الطلب.",
    en: "Choose an address and a payment method to confirm your order.",
  },
  "← العودة إلى السلة": { ar: "← العودة إلى السلة", en: "← Back to cart" },
};

const themeWalk = createRawaqThemeWalk(BILINGUAL);

export function createRawaqCheckoutPageContent(): ComponentDataOptionalId[] {
  return themeWalk(
    createCheckoutPageContent(),
    "checkout"
  ) as ComponentDataOptionalId[];
}

export function createRawaqCheckoutSitePage(): SitePage {
  return {
    path: "/checkout",
    slug: "/checkout",
    link: "/checkout",
    name: { ar: "إتمام الطلب", en: "Checkout" },
    title: { ar: "إتمام الطلب", en: "Checkout" },
    description: {
      ar: "اختيار العنوان وطريقة الدفع وتأكيد الطلب.",
      en: "Pick an address and payment method, then confirm the order.",
    },
    iconName: "ShoppingCart",
    isCustom: false,
    content: createRawaqCheckoutPageContent(),
  };
}
