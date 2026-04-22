export type OrderStatus =
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

export type OrderPaymentMethod = "COD" | "PAYMERA"
export type OrderNoteChannel = "INTERNAL" | "CUSTOMER"

export interface AdminOrderShippingAddress {
	country?: string | null
	governorate?: string | null
	city?: string | null
	district?: string | null
	street?: string | null
	details?: string | null
	phone?: string | null
	name?: string | null
}

export interface AdminOrderCustomer {
	id?: string
	customerId?: string
	name?: string
	fullName?: string
	firstName?: string
	lastName?: string
	email?: string
	phone?: string
	avatarUrl?: string | null
	createdAt?: string
	joinedAt?: string
	shippingAddress?: AdminOrderShippingAddress | null
}

export interface AdminOrderItem {
	id?: string
	orderItemId?: string
	variantId?: string
	title?: string
	productTitle?: string
	variantTitle?: string
	sku?: string
	variantSku?: string
	quantity?: number
	unitPrice?: number
	totalPrice?: number
	priceLabel?: string
	inventoryLabel?: string
	inventoryStatus?: string
	thumbnailUrl?: string | null
	imageUrl?: string | null
}

export interface AdminOrderPricing {
	subtotal?: number
	shippingCost?: number
	taxAmount?: number
	total?: number
	currencyCode?: string
	subtotalLabel?: string
	logisticsAndTaxesLabel?: string
	totalLabel?: string
}

export interface AdminOrderTimelineEvent {
	id?: string
	eventId?: string
	eventType?: string
	title?: string
	description?: string
	details?: string
	createdAt?: string
	occurredAt?: string
	timestampLabel?: string
	isCurrent?: boolean
}

export interface AdminOrderNote {
	id?: string
	noteId?: string
	authorRole?: string
	authorName?: string
	body?: string
	message?: string
	channel: OrderNoteChannel
	createdAt?: string
	updatedAt?: string
	timestampLabel?: string
}

export interface AdminOrderListItem {
	id?: string
	orderId?: string
	orderNumber?: string
	orderCode?: string
	status: OrderStatus
	placedAt?: string
	createdAt?: string
	customerName?: string
	customerAvatarUrl?: string | null
	guestName?: string
	customer?: AdminOrderCustomer | null
}

export interface AdminOrder {
	id?: string
	orderId?: string
	orderNumber?: string
	status: OrderStatus
	placedAt?: string
	createdAt?: string
	currencyCode?: string
	paymentMethod?: OrderPaymentMethod
	customerName?: string
	guestName?: string
	customer?: AdminOrderCustomer | null
	shippingAddress?: AdminOrderShippingAddress | null
	items?: AdminOrderItem[]
	pricing?: AdminOrderPricing | null
	timeline?: AdminOrderTimelineEvent[]
	auditTrail?: AdminOrderTimelineEvent[]
	notes?: AdminOrderNote[]
	notesInternal?: string | null
	notesCustomer?: string | null
}

export interface AdminOrdersSummary {
	totalOrders?: number
	returnsCount?: number
	inDeliveryCount?: number
	totalRevenue?: number
	revenue?: number
	currencyCode?: string
}

export interface PaginatedApiResponse<T> {
	content?: T[]
	items?: T[]
	totalElements?: number
	totalItems?: number
	totalPages?: number
	page?: number
	number?: number
	size?: number
}

export interface ListAdminOrdersParams {
	page?: number
	size?: number
	sort?: string
	status?: OrderStatus
}

export interface TransitionOrderStatusPayload {
	targetStatus: Exclude<OrderStatus, "NEW">
}

export interface TransitionOrderStatusInput {
	id: string
	data: TransitionOrderStatusPayload
}

export interface CancelOrderPayload {
	reason: string
}

export interface CancelOrderInput {
	id: string
	data: CancelOrderPayload
}

export interface UpdateOrderNotesPayload {
	notesInternal?: string
	notesCustomer?: string
}

export interface UpdateOrderNotesInput {
	id: string
	data: UpdateOrderNotesPayload
}

export interface EditOrderItemInput {
	variantId: string
	quantity: number
}

export interface EditOrderPayload {
	items: EditOrderItemInput[]
	shippingAddress: AdminOrderShippingAddress
}

export interface EditOrderInput {
	id: string
	data: EditOrderPayload
}
