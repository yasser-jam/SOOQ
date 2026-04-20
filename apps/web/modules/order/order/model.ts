export interface OrderRouteParams {
	order_id: string
}

export interface OrderDetailsPageRouteProps {
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
