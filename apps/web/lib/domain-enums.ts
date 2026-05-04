export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED"
  | "FAILED"

export type PaymentStatus =
  | "UNPAID"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"

export type ShipmentStatus =
  | "PENDING"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "READY_FOR_PICKUP_AT_OFFICE"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED"

export type SettlementStatus = "PENDING" | "SETTLED" | "DISPUTED"

export type PaymentMethod = "COD" | "PAYMERA"

export type BadgeVariant =
  | "default"
  | "secondary"
  | "secondary-tonal"
  | "outline"
  | "destructive"

export type StatusMeta = {
  label: string
  badgeVariant: BadgeVariant
}

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING: { label: "قيد الانتظار", badgeVariant: "secondary" },
  CONFIRMED: { label: "مؤكد", badgeVariant: "secondary-tonal" },
  PROCESSING: { label: "قيد المعالجة", badgeVariant: "secondary-tonal" },
  SHIPPED: { label: "تم الشحن", badgeVariant: "secondary-tonal" },
  DELIVERED: { label: "تم التسليم", badgeVariant: "outline" },
  COMPLETED: { label: "مكتمل", badgeVariant: "outline" },
  CANCELLED: { label: "ملغي", badgeVariant: "destructive" },
  RETURNED: { label: "مرتجع", badgeVariant: "destructive" },
  REFUNDED: { label: "تم الاسترداد", badgeVariant: "destructive" },
  FAILED: { label: "فشل", badgeVariant: "destructive" },
}

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  UNPAID: { label: "غير مدفوع", badgeVariant: "secondary" },
  PENDING: { label: "قيد المعالجة", badgeVariant: "secondary-tonal" },
  PAID: { label: "مدفوع", badgeVariant: "outline" },
  FAILED: { label: "فشل الدفع", badgeVariant: "destructive" },
  REFUNDED: { label: "تم الاسترداد", badgeVariant: "destructive" },
}

export const SHIPMENT_STATUS_META: Record<ShipmentStatus, StatusMeta> = {
  PENDING: { label: "بانتظار الاستلام", badgeVariant: "secondary" },
  PICKED_UP: { label: "تم الاستلام", badgeVariant: "secondary-tonal" },
  IN_TRANSIT: { label: "قيد التوصيل", badgeVariant: "secondary-tonal" },
  READY_FOR_PICKUP_AT_OFFICE: {
    label: "جاهز للاستلام من المكتب",
    badgeVariant: "secondary-tonal",
  },
  DELIVERED: { label: "تم التسليم", badgeVariant: "outline" },
  FAILED: { label: "فشل التوصيل", badgeVariant: "destructive" },
  RETURNED: { label: "مرتجع", badgeVariant: "destructive" },
}

export const SETTLEMENT_STATUS_META: Record<SettlementStatus, StatusMeta> = {
  PENDING: { label: "قيد التسوية", badgeVariant: "secondary" },
  SETTLED: { label: "تمت التسوية", badgeVariant: "outline" },
  DISPUTED: { label: "متنازع عليها", badgeVariant: "destructive" },
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: "الدفع عند الاستلام",
  PAYMERA: "Paymera (بطاقة Visa/MasterCard)",
}
