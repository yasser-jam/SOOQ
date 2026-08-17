import type { ComponentDataOptionalId } from "@/core/types";
import type { SitePage } from "../lib/site-data";
import { createRawaqThemeWalk } from "./rawaq-theme-walk";
import {
  createCancelOrderZonePopup,
  createOrderDetailPageContent,
  createOrdersPageContent,
} from "./orders";

/**
 * Rawaq (روّاق) styling layer over the shared `/orders` presets.
 * Styling rules live in `./rawaq-theme-walk`; this file owns the translations
 * and the SitePage wrappers.
 */

const BILINGUAL: Record<string, { ar: string; en: string }> = {
  "سجّل دخولك لعرض طلباتك.": {
    ar: "سجّل دخولك لعرض طلباتك.",
    en: "Sign in to view your orders.",
  },
  "يمكنك تسجيل الدخول برقم هاتفك لمتابعة طلباتك وإدارة حسابك.": {
    ar: "يمكنك تسجيل الدخول برقم هاتفك لمتابعة طلباتك وإدارة حسابك.",
    en: "Sign in with your phone number to track orders and manage your account.",
  },
  "تسجيل الدخول": { ar: "تسجيل الدخول", en: "Sign in" },
  "قائمة الطلبات": { ar: "قائمة الطلبات", en: "Your orders" },
  "تصفّح الطلبات": { ar: "تصفّح الطلبات", en: "Browse orders" },
  "السابق": { ar: "السابق", en: "Previous" },
  "التالي": { ar: "التالي", en: "Next" },
  "تاريخ الطلب": { ar: "تاريخ الطلب", en: "Order date" },
  الإجمالي: { ar: "الإجمالي", en: "Total" },
  "عرض التفاصيل": { ar: "عرض التفاصيل", en: "View details" },
  "سجّل دخولك لعرض تفاصيل الطلب.": {
    ar: "سجّل دخولك لعرض تفاصيل الطلب.",
    en: "Sign in to view order details.",
  },
  "← كل الطلبات": { ar: "← كل الطلبات", en: "← All orders" },
  "تحميل الفاتورة": { ar: "تحميل الفاتورة", en: "Download invoice" },
  "إلغاء الطلب": { ar: "إلغاء الطلب", en: "Cancel order" },
  المنتجات: { ar: "المنتجات", en: "Products" },
  الكمية: { ar: "الكمية", en: "Quantity" },
  "سعر الوحدة": { ar: "سعر الوحدة", en: "Unit price" },
  "الكمية المُرجعة": { ar: "الكمية المُرجعة", en: "Return quantity" },
  "حالة المنتج": { ar: "حالة المنتج", en: "Item condition" },
  "ملخّص الدفع": { ar: "ملخّص الدفع", en: "Payment summary" },
  "المجموع الفرعي": { ar: "المجموع الفرعي", en: "Subtotal" },
  الخصم: { ar: "الخصم", en: "Discount" },
  الضريبة: { ar: "الضريبة", en: "Tax" },
  "تكلفة الشحن": { ar: "تكلفة الشحن", en: "Shipping" },
  "عنوان التوصيل": { ar: "عنوان التوصيل", en: "Delivery address" },
  ملاحظاتك: { ar: "ملاحظاتك", en: "Your notes" },
  "سجلّ الطلب": { ar: "سجلّ الطلب", en: "Order timeline" },
  "طلب إرجاع": { ar: "طلب إرجاع", en: "Return request" },
  "طلب إرجاع المنتجات": {
    ar: "طلب إرجاع المنتجات",
    en: "Request item return",
  },
  "تم إرسال طلب الإرجاع بنجاح.": {
    ar: "تم إرسال طلب الإرجاع بنجاح.",
    en: "Your return request was submitted successfully.",
  },
  "سيتم إلغاء الطلب. لا يمكن التراجع عن هذه الخطوة.": {
    ar: "سيتم إلغاء الطلب. لا يمكن التراجع عن هذه الخطوة.",
    en: "The order will be cancelled. This cannot be undone.",
  },
  "سبب الإلغاء (اختياري)": {
    ar: "سبب الإلغاء (اختياري)",
    en: "Cancellation reason (optional)",
  },
  تراجع: { ar: "تراجع", en: "Go back" },
  "تأكيد الإلغاء": { ar: "تأكيد الإلغاء", en: "Confirm cancellation" },
};

const themeWalk = createRawaqThemeWalk(BILINGUAL);

export function createRawaqOrdersPageContent(): ComponentDataOptionalId[] {
  return themeWalk(
    createOrdersPageContent(),
    "orders"
  ) as ComponentDataOptionalId[];
}

export function createRawaqOrderDetailPageContent(): ComponentDataOptionalId[] {
  return themeWalk(
    createOrderDetailPageContent(),
    "order-detail"
  ) as ComponentDataOptionalId[];
}

export function createRawaqCancelOrderZonePopup(): ComponentDataOptionalId {
  return themeWalk(
    createCancelOrderZonePopup(),
    "cancel-order"
  ) as ComponentDataOptionalId;
}

export function createRawaqOrdersSitePage(): SitePage {
  return {
    path: "/orders",
    slug: "/orders",
    link: "/orders",
    name: { ar: "طلباتي", en: "My orders" },
    title: { ar: "طلباتي", en: "My orders" },
    description: {
      ar: "عرض سجلّ الطلبات وتتبُّع حالتها.",
      en: "View your order history and track status.",
    },
    iconName: "Package",
    isCustom: false,
    content: createRawaqOrdersPageContent(),
  };
}

export function createRawaqOrderDetailSitePage(): SitePage {
  return {
    path: "/orders/:order-id",
    slug: "/orders/example-order",
    link: "/orders/example-order",
    name: { ar: "تفاصيل الطلب", en: "Order details" },
    title: { ar: "تفاصيل الطلب", en: "Order details" },
    description: {
      ar: "تفاصيل الطلب والمنتجات والدفع وسجلّ التحديثات.",
      en: "Order details, items, payment summary, and timeline.",
    },
    iconName: "Package",
    dynamic: true,
    examplePath: "/orders/example-order",
    content: createRawaqOrderDetailPageContent(),
  };
}
