/**
 * Storefront enum label maps for Chip.valueContext + enumMap bindings.
 *
 * Duplicated from apps/web/lib/domain-enums.ts and customer-orders-api.ts —
 * config/ must not import from apps/web (see data-adapter.spec.ts).
 */

export type EnumBadgeVariant =
  | "primary"
  | "secondary"
  | "neutral"
  | "success"
  | "warning"
  | "danger";

export type EnumEntry = { label: string; variant: EnumBadgeVariant };

const ORDER_STATUS: Record<string, EnumEntry> = {
  PENDING: { label: "قيد الانتظار", variant: "neutral" },
  CONFIRMED: { label: "مؤكد", variant: "primary" },
  PROCESSING: { label: "قيد المعالجة", variant: "primary" },
  SHIPPED: { label: "تم الشحن", variant: "primary" },
  DELIVERED: { label: "تم التسليم", variant: "success" },
  COMPLETED: { label: "مكتمل", variant: "success" },
  CANCELLED: { label: "ملغي", variant: "danger" },
  RETURNED: { label: "مرتجع", variant: "danger" },
  REFUNDED: { label: "تم الاسترداد", variant: "danger" },
  FAILED: { label: "فشل", variant: "danger" },
};

const PAYMENT_STATUS: Record<string, EnumEntry> = {
  UNPAID: { label: "غير مدفوع", variant: "neutral" },
  PENDING: { label: "قيد المعالجة", variant: "warning" },
  PAID: { label: "مدفوع", variant: "success" },
  FAILED: { label: "فشل الدفع", variant: "danger" },
  REFUNDED: { label: "تم الاسترداد", variant: "danger" },
};

const PAYMENT_METHOD: Record<string, EnumEntry> = {
  COD: { label: "الدفع عند الاستلام", variant: "neutral" },
  PAYMERA: { label: "Paymera (بطاقة Visa/MasterCard)", variant: "neutral" },
};

const TIMELINE_ACTION: Record<string, EnumEntry> = {
  ORDER_CREATED: { label: "تم إنشاء الطلب", variant: "neutral" },
  CONFIRMED: { label: "تم تأكيد الطلب", variant: "neutral" },
  PROCESSING: { label: "بدأت معالجة الطلب", variant: "neutral" },
  SHIPPED: { label: "تم شحن الطلب", variant: "neutral" },
  DELIVERED: { label: "تم تسليم الطلب", variant: "neutral" },
  COMPLETED: { label: "تم إكمال الطلب", variant: "neutral" },
  CANCELLED: { label: "تم إلغاء الطلب", variant: "neutral" },
  RETURNED: { label: "تم إرجاع الطلب", variant: "neutral" },
  REFUNDED: { label: "تم استرداد المبلغ", variant: "neutral" },
  FAILED: { label: "فشل الطلب", variant: "neutral" },
  NOTES_UPDATED: { label: "تم تحديث الملاحظات", variant: "neutral" },
  ORDER_EDITED: { label: "تم تعديل الطلب", variant: "neutral" },
  PAYMENT_CAPTURED: { label: "تم استلام الدفعة", variant: "neutral" },
};

const TIMELINE_ACTOR: Record<string, EnumEntry> = {
  CUSTOMER: { label: "العميل", variant: "neutral" },
  MERCHANT: { label: "المتجر", variant: "neutral" },
  ADMIN: { label: "المتجر", variant: "neutral" },
  SYSTEM: { label: "النظام", variant: "neutral" },
};

const RETURN_ITEM_CONDITION: Record<string, EnumEntry> = {
  OPENED: { label: "مفتوح", variant: "neutral" },
  UNOPENED: { label: "غير مفتوح", variant: "success" },
  USED: { label: "مستعمل", variant: "warning" },
  DAMAGED: { label: "تالف", variant: "danger" },
};

export const ENUM_MAPS = {
  orderStatus: ORDER_STATUS,
  paymentStatus: PAYMENT_STATUS,
  paymentMethod: PAYMENT_METHOD,
  timelineAction: TIMELINE_ACTION,
  timelineActor: TIMELINE_ACTOR,
  returnItemCondition: RETURN_ITEM_CONDITION,
} as const;

export type EnumMapKey = keyof typeof ENUM_MAPS;

export const ENUM_MAP_OPTIONS: { label: string; value: EnumMapKey }[] = [
  { label: "حالة الطلب", value: "orderStatus" },
  { label: "حالة الدفع", value: "paymentStatus" },
  { label: "طريقة الدفع", value: "paymentMethod" },
  { label: "إجراء السجل", value: "timelineAction" },
  { label: "فاعل السجل", value: "timelineActor" },
  { label: "حالة المرتجع", value: "returnItemCondition" },
];

export function isEnumMapKey(value: unknown): value is EnumMapKey {
  return typeof value === "string" && value in ENUM_MAPS;
}

export function lookupEnumEntry(
  mapKey: unknown,
  value: string
): EnumEntry | undefined {
  if (!isEnumMapKey(mapKey)) return undefined;
  const map = ENUM_MAPS[mapKey];
  if (!Object.prototype.hasOwnProperty.call(map, value)) return undefined;
  return map[value];
}
