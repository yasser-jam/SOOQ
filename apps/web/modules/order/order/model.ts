import type { OrderStatus } from "./types"

export interface OrderRouteParams {
	order_id: string
}

export interface OrderDetailsPageRouteProps {
	params: Promise<OrderRouteParams>
}

export interface OrderReturnsPageRouteProps {
	params: Promise<OrderRouteParams>
}

export const ORDER_LIST_STATUS_META: Record<
	OrderStatus,
	{ label: string; badgeVariant: "secondary" | "secondary-tonal" | "outline" | "destructive" }
> = {
	NEW: {
		label: "جديد",
		badgeVariant: "secondary",
	},
	PENDING: {
		label: "قيد الانتظار",
		badgeVariant: "secondary",
	},
	CONFIRMED: {
		label: "مؤكد",
		badgeVariant: "secondary-tonal",
	},
	PROCESSING: {
		label: "قيد المعالجة",
		badgeVariant: "secondary-tonal",
	},
	SHIPPED: {
		label: "تم الشحن",
		badgeVariant: "secondary-tonal",
	},
	OUT_FOR_DELIVERY: {
		label: "قيد التوصيل",
		badgeVariant: "secondary-tonal",
	},
	DELIVERED: {
		label: "تم التسليم",
		badgeVariant: "outline",
	},
	CANCELLED: {
		label: "ملغي",
		badgeVariant: "destructive",
	},
	RETURN_REQUESTED: {
		label: "طلب إرجاع",
		badgeVariant: "destructive",
	},
	RETURNED: {
		label: "تم الإرجاع",
		badgeVariant: "destructive",
	},
}
