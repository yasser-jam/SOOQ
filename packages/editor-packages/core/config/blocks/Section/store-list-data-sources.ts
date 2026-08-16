"use client";

import type { CustomerAddress } from "../../store-context";

export type StoreListDataSourceKey =
  | "addresses"
  | "orders"
  | "order.items"
  | "order.timeline";

export type StoreListDataSource = {
  list: unknown[];
  isLoading: boolean;
  isError: boolean;
  sample: unknown[];
  keyOf: (entry: unknown) => string;
  boundKey: string;
  emptyMessage: string;
  errorMessage: string;
  staleTemplateMessage: string;
};

export const SAMPLE_CUSTOMER_ADDRESSES: CustomerAddress[] = [
  {
    addressId: "sample-address-1",
    label: "HOME",
    recipientName: "أحمد محمد",
    recipientPhone: "+963991234567",
    governorate: "دمشق",
    city: "المزة",
    streetAddress: "شارع الجلاء",
    notes: null,
    latitude: 33.5138,
    longitude: 36.2765,
    isDefault: true,
    createdAt: "2025-06-01T08:00:00Z",
    updatedAt: "2025-06-01T08:00:00Z",
  },
  {
    addressId: "sample-address-2",
    label: "WORK",
    recipientName: "أحمد محمد",
    recipientPhone: "+963991234567",
    governorate: "ريف دمشق",
    city: "جرمانا",
    streetAddress: "شارع الثورة",
    notes: "بجانب المدرسة",
    latitude: 33.485,
    longitude: 36.345,
    isDefault: false,
    createdAt: "2025-08-10T12:00:00Z",
    updatedAt: "2025-08-10T12:00:00Z",
  },
];

export const SAMPLE_CUSTOMER_ORDERS = [
  {
    orderId: "sample-order-1",
    orderNumber: "ORD-1001",
    orderStatus: "DELIVERED",
    paymentStatus: "PAID",
    total: 125000,
    placedAt: "2025-06-15T10:00:00.000Z",
  },
  {
    orderId: "sample-order-2",
    orderNumber: "ORD-1002",
    orderStatus: "PROCESSING",
    paymentStatus: "PAID",
    total: 48000,
    placedAt: "2025-07-01T14:30:00.000Z",
  },
];

export const SAMPLE_ORDER_ITEMS = [
  {
    orderItemId: "sample-item-1",
    productTitle: "قميص قطني",
    sku: "SHIRT-001",
    quantity: 2,
    unitPrice: 25000,
    totalPrice: 50000,
  },
  {
    orderItemId: "sample-item-2",
    productTitle: "بنطال جينز",
    sku: "JEANS-002",
    quantity: 1,
    unitPrice: 75000,
    totalPrice: 75000,
  },
];

export const SAMPLE_ORDER_TIMELINE = [
  {
    timelineId: "sample-timeline-1",
    action: "ORDER_CREATED",
    actor: "CUSTOMER",
    details: null,
    createdAt: "2025-06-15T10:00:00.000Z",
  },
  {
    timelineId: "sample-timeline-2",
    action: "CONFIRMED",
    actor: "MERCHANT",
    details: null,
    createdAt: "2025-06-15T11:00:00.000Z",
  },
];

function addressKey(entry: unknown): string {
  const record = entry as CustomerAddress;
  return record.addressId;
}

function orderKey(entry: unknown): string {
  const record = entry as { orderId?: string };
  return record.orderId ?? "order";
}

function orderItemKey(entry: unknown): string {
  const record = entry as { orderItemId?: string };
  return record.orderItemId ?? "order-item";
}

function timelineKey(entry: unknown): string {
  const record = entry as { timelineId?: string };
  return record.timelineId ?? "timeline";
}

export const STORE_LIST_DATA_SOURCES: Record<
  StoreListDataSourceKey,
  Omit<StoreListDataSource, "list" | "isLoading" | "isError">
> = {
  addresses: {
    sample: SAMPLE_CUSTOMER_ADDRESSES,
    keyOf: addressKey,
    boundKey: "address",
    emptyMessage: "لا توجد عناوين محفوظة بعد.",
    errorMessage: "تعذّر تحميل العناوين.",
    staleTemplateMessage:
      "تعذّر عرض بطاقة العنوان — أعد حفظ قسم العناوين من محرّك التصميم.",
  },
  orders: {
    sample: SAMPLE_CUSTOMER_ORDERS,
    keyOf: orderKey,
    boundKey: "order",
    emptyMessage: "لا توجد طلبات بعد.",
    errorMessage: "تعذّر تحميل الطلبات.",
    staleTemplateMessage:
      "تعذّر عرض بطاقة الطلب — أعد حفظ قسم الطلبات من محرّك التصميم.",
  },
  "order.items": {
    sample: SAMPLE_ORDER_ITEMS,
    keyOf: orderItemKey,
    boundKey: "item",
    emptyMessage: "لا توجد منتجات في هذا الطلب.",
    errorMessage: "تعذّر تحميل منتجات الطلب.",
    staleTemplateMessage:
      "تعذّر عرض منتج الطلب — أعد حفظ القسم من محرّك التصميم.",
  },
  "order.timeline": {
    sample: SAMPLE_ORDER_TIMELINE,
    keyOf: timelineKey,
    boundKey: "timelineEntry",
    emptyMessage: "لا يوجد سجل للطلب.",
    errorMessage: "تعذّر تحميل سجل الطلب.",
    staleTemplateMessage:
      "تعذّر عرض سجل الطلب — أعد حفظ القسم من محرّك التصميم.",
  },
};

export function isStoreListDataSourceKey(
  value: unknown
): value is StoreListDataSourceKey {
  return typeof value === "string" && value in STORE_LIST_DATA_SOURCES;
}

export function sectionKindToDataSource(
  sectionKind: string | null | undefined
): StoreListDataSourceKey | null {
  switch (sectionKind) {
    case "customer-addresses":
      return "addresses";
    case "customer-orders":
      return "orders";
    case "customer-order-items":
      return "order.items";
    case "customer-order-timeline":
      return "order.timeline";
    default:
      return null;
  }
}
