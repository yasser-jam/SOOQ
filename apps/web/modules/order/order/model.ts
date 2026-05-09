import {
	ORDER_STATUS_META,
	PAYMENT_STATUS_META,
} from "@/lib/domain-enums"

import type { OrderStatus, TransitionableOrderStatus } from "./types"

export interface OrderRouteParams {
	order_id: string
}

export interface OrderDetailsPageRouteProps {
	params: Promise<OrderRouteParams>
}

export interface OrderReturnsPageRouteProps {
	params: Promise<OrderRouteParams>
}

export const ORDER_LIST_STATUS_META = ORDER_STATUS_META
export const ORDER_LIST_PAYMENT_STATUS_META = PAYMENT_STATUS_META

/**
 * Allowed status transitions per current state. Mirrors the backend state machine.
 * Source: docs/FRONTEND_PAGES_ORD_PAY_SHP.md §A3 (Order action buttons).
 */
export const ALLOWED_ORDER_TRANSITIONS: Record<
	OrderStatus,
	TransitionableOrderStatus[]
> = {
	PENDING: ["CONFIRMED"],
	CONFIRMED: ["PROCESSING"],
	PROCESSING: ["SHIPPED"],
	SHIPPED: ["DELIVERED", "FAILED"],
	DELIVERED: ["COMPLETED", "RETURNED"],
	COMPLETED: [],
	CANCELLED: [],
	RETURNED: ["REFUNDED"],
	REFUNDED: [],
	FAILED: [],
}

export const CANCELLABLE_STATUSES: OrderStatus[] = [
	"PENDING",
	"CONFIRMED",
	"PROCESSING",
]

export const EDITABLE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED"]

/** Status set where a refund can be initiated via /admin/refunds (Phase 8). */
export const REFUNDABLE_STATUSES: OrderStatus[] = ["DELIVERED", "COMPLETED"]

/** Action verb labels for transitions (Arabic). */
export const ORDER_TRANSITION_ACTION_LABELS: Record<
	TransitionableOrderStatus,
	string
> = {
	CONFIRMED: "تأكيد الطلب",
	PROCESSING: "بدء المعالجة",
	SHIPPED: "تأشير كمشحون",
	DELIVERED: "تأشير كمسلَّم",
	COMPLETED: "إكمال الطلب",
	CANCELLED: "إلغاء الطلب",
	RETURNED: "تأشير كمرتجع",
	REFUNDED: "تأشير كمسترد",
	FAILED: "تأشير كفاشل",
}

/** Translations for timeline event types coming from the backend audit log. */
export const TIMELINE_EVENT_LABELS: Record<string, string> = {
	ORDER_CREATED: "تم إنشاء الطلب",
	CONFIRMED: "تم تأكيد الطلب",
	PROCESSING: "بدء المعالجة",
	SHIPPED: "تم شحن الطلب",
	DELIVERED: "تم تسليم الطلب",
	COMPLETED: "تم إكمال الطلب",
	CANCELLED: "تم إلغاء الطلب",
	RETURNED: "تم إرجاع الطلب",
	REFUNDED: "تم استرداد الطلب",
	FAILED: "فشل الطلب",
	NOTES_UPDATED: "تم تحديث الملاحظات",
	ORDER_EDITED: "تم تعديل الطلب",
}
