export interface OrderRouteParams {
	order_id: string
}

export interface OrderDetailsPageRouteProps {
	params: Promise<OrderRouteParams>
}

export interface OrderReturnsPageRouteProps {
	params: Promise<OrderRouteParams>
}

export interface OrderCustomerContactModel {
	phone?: string
	email?: string
}

export interface OrderShippingAddressModel {
	country?: string
	city?: string
	district?: string
	details?: string
}

export interface OrderCustomerModel {
	name?: string
	joinDateLabel?: string
	avatarUrl?: string | null
	contact?: OrderCustomerContactModel
	shippingAddress?: OrderShippingAddressModel
}

export interface OrderLineItemModel {
	id: string
	title: string
	sku: string
	quantity: number
	priceLabel: string
	inventoryLabel: string
	thumbnailUrl?: string | null
}

export interface OrderPricingModel {
	subtotalLabel: string
	logisticsAndTaxesLabel: string
	totalLabel: string
}

export interface OrderAuditEventModel {
	id: string
	timestampLabel: string
	title: string
	description: string
	isCurrent?: boolean
}

export interface OrderNoteModel {
	id: string
	authorRole: string
	body: string
	timestampLabel: string
	channel: "INTERNAL" | "CUSTOMER"
}

export interface OrderNotesModel {
	internalNotes: OrderNoteModel[]
	customerVisibleNotes: OrderNoteModel[]
}

export interface OrderDetailsModel {
	orderId: string
	customer?: OrderCustomerModel
	items?: OrderLineItemModel[]
	pricing?: OrderPricingModel
	auditTrail?: OrderAuditEventModel[]
	notes?: OrderNotesModel
}

export type OrderListStatus =
	| "NEW"
	| "PENDING"
	| "CONFIRMED"
	| "PROCESSING"
	| "SHIPPED"
	| "OUT_FOR_DELIVERY"
	| "DELIVERED"
	| "CANCELLED"
	| "RETURN_REQUESTED"
	| "RETURNED"

export interface OrderListClientModel {
	name: string
	avatarUrl?: string | null
}

export interface OrderListItemModel {
	id: string
	orderNumber: string
	client: OrderListClientModel
	dateLabel: string
	status: OrderListStatus
}

export const ORDER_LIST_STATUS_META: Record<
	OrderListStatus,
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
