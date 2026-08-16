import type { ComponentDataOptionalId } from "@/core/types";
import type { SitePage } from "../lib/site-data";
import {
  createCancelOrderZonePopup,
  createOrderDetailPageContent,
  createOrdersPageContent,
} from "./orders";

/**
 * Rawaq (روّاق) styling layer over the shared `/orders` presets.
 *
 * Mirrors `orders-meridian.ts`: the structure, data bindings and actions come
 * verbatim from `./orders`; only the theme-owned visual props are rewritten to
 * Rawaq's warm/flat furniture language (linen sections `#f7f2ea`, off-white
 * cards `#fffdf9`, 2–4px radii, El Messiri headings, square badges).
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

/** Linen page background used by every Rawaq content section. */
const SECTION_BG = "#f7f2ea";
/** Off-white card surface that sits on the linen background. */
const CARD_BG = "#fffdf9";

function bilingual(text: unknown): unknown {
  if (typeof text !== "string") return text;
  const trimmed = text.trim();
  if (!trimmed) return { ar: "", en: "" };
  return BILINGUAL[trimmed] ?? { ar: trimmed, en: trimmed };
}

/** Rawaq reads RTL: the shared presets default to `left`, which we flip. */
function rtlAlign(value: unknown): string {
  return value === "center" ? "center" : "right";
}

function isMoneyValue(props: Record<string, unknown>): boolean {
  const context = props.valueContext as { format?: string } | undefined;
  return context?.format === "money";
}

function headingStyles(props: Record<string, unknown>) {
  const centered = props.textAlign === "center";
  props.level ??= centered ? "2" : "3";
  props.fontFamily = "option1";
  props.fontSize = centered ? "theme-xl" : "theme-lg";
  props.fontWeight = "theme-bold";
  props.lineHeight = "theme-tight";
  props.fontStyle = "normal";
  props.textTransform = "none";
  props.color = "theme-text";
  props.textAlign = rtlAlign(props.textAlign);
}

function paragraphStyles(props: Record<string, unknown>) {
  const money = isMoneyValue(props);
  props.fontFamily = "body";
  props.fontSize = "theme-md";
  props.fontWeight = money ? "theme-bold" : "theme-light";
  props.lineHeight = "theme-normal";
  props.fontStyle = "normal";
  props.textTransform = "none";
  props.color = money ? "theme-primary" : "theme-neutral";
  props.textAlign = rtlAlign(props.textAlign);
}

function linkStyles(props: Record<string, unknown>) {
  props.align = rtlAlign(props.align);
  props.color = "theme-primary";
  props.hoverEffect = "border";
  props.hoverColor = "theme-primary";
  props.fontSize = "theme-md";
  props.icon = "chevron-left";
  props.iconPosition = "end";
}

function buttonStyles(props: Record<string, unknown>) {
  const compact = props.buttonVariant === "secondary";
  props.align = "center";
  props.buttonVariantMode = "variant";
  props.buttonVariantSize = compact ? "sm" : "md";
  props.buttonSize = compact ? "theme-sm" : "theme-md";
  props.radius = "theme-sm";
  props.bgColor = "theme-primary";
  props.textColor = "theme-surface";
  props.submitRedirectUrl ??= "";
  props.link ??= { kind: "none" };
}

function themeWalk(
  node: unknown,
  path: string,
  depth = 0
): ComponentDataOptionalId | ComponentDataOptionalId[] | unknown {
  if (Array.isArray(node)) {
    return node.map((entry, index) =>
      themeWalk(entry, `${path}-${index}`, depth + 1)
    ) as ComponentDataOptionalId[];
  }

  if (!node || typeof node !== "object") return node;

  const record = node as ComponentDataOptionalId;
  if (!record.type || !record.props) return node;

  const type = record.type;
  const props: Record<string, unknown> = { ...record.props };

  if (!props.id) {
    props.id = `${type}-${path}`.replace(/[^a-zA-Z0-9-]/g, "-");
  }

  if (type === "Section") {
    props.visible ??= true;
    props.paddingHorizontal = "32px";
    props.backgroundColor = SECTION_BG;
    props.backgroundImage ??= "";
    props.backgroundOverlayColor ??= "";
    props.theme = "dark";
    props.columns ??= 1;
    props.columnsMobile ??= 1;
    props.gridGap = "28px";
  }

  if (type === "Group" && props.padding === "24px") {
    props.backgroundColor = CARD_BG;
    props.padding = "28px";
    props.borderRadius = "theme-md";
    props.boxShadow = "none";
    props.cartLineId = null;
    props.backgroundImage ??= "";
    props.backgroundOverlayColor ??= "";
    props.product ??= null;
    props.metadata ??= null;
    props.language ??= "ar";
  }

  if (type === "RowGroup") {
    props.gap ??= 16;
    props.alignItems ??= "center";
    props.justifyContent ??= "space-between";
    props.wrap ??= "wrap";
    props.backgroundColor ??= "";
    props.padding ??= "0px";
    props.borderRadius ??= "theme-none";
  }

  if (type === "Chip") {
    // Keep `chipVariantMode: "theme"` so enum maps still drive status colors;
    // Rawaq only squares off the badge shape.
    props.shape = "square";
    props.size ??= "sm";
    props.gap ??= 6;
  }

  if (type === "ZonePopup") {
    props.is_active = false;
    props.borderRadius = "4px";
    props.backgroundColor = CARD_BG;
    // Matches the theme's own login popup.
    props.maxWidth = "440px";
    props.overlay ??= true;
    props.showCloseButton ??= true;
  }

  for (const key of ["text", "label", "title", "placeholder", "helperText"]) {
    if (key in props) props[key] = bilingual(props[key]);
  }

  if (type === "ContentHeading") headingStyles(props);
  if (type === "ContentParagraph") paragraphStyles(props);
  if (type === "ContentLink") linkStyles(props);
  if (type === "ContentButton") buttonStyles(props);

  if (props.content != null) {
    props.content = themeWalk(props.content, `${path}-content`, depth + 1);
  }
  if (props.cardTemplate != null) {
    props.cardTemplate = themeWalk(
      props.cardTemplate,
      `${path}-cardTemplate`,
      depth + 1
    );
  }
  if (props.slot != null) {
    props.slot = themeWalk(props.slot, `${path}-slot`, depth + 1);
  }

  return { type, props } as ComponentDataOptionalId;
}

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
