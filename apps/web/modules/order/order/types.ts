import z from "zod"
import { editOrderSchema, orderSchema } from "./schema"
import type {
	OrderStatus,
	PaymentStatus,
	PaymentMethod,
} from "@/lib/domain-enums"
import type { Page } from "@/lib/types"

export type { OrderStatus, PaymentStatus, PaymentMethod } from "@/lib/domain-enums"

export type OrderPaymentMethod = PaymentMethod
export type OrderNoteChannel = "INTERNAL" | "CUSTOMER"

export type Order = z.infer<typeof orderSchema>

export interface AdminOrderShippingAddress {
	latitude?: number
	longitude?: number
	recipientName?: string | null
	phone?: string | null
	addressLabel?: string | null
	name?: string | null
	country?: string | null
	governorate?: string | null
	city?: string | null
	district?: string | null
	street?: string | null
	details?: string | null
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

export interface AdminOrderTimelineEventDetails {
	reason?: string
	editedFields?: string[]
	[key: string]: unknown
}

export interface AdminOrderTimelineEvent {
	id?: string
	eventId?: string
	eventType?: string
	title?: string
	description?: string
	details?: string | AdminOrderTimelineEventDetails | null
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
	paymentStatus?: PaymentStatus
	itemCount?: number
	total?: number
	currencyCode?: string
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
	paymentStatus?: PaymentStatus
	paymentRedirectUrl?: string | null
	placedAt?: string
	createdAt?: string
	currencyCode?: string
	paymentMethod?: PaymentMethod
	paymeraTxnId?: string | null
	customerName?: string
	guestName?: string
	guestEmail?: string | null
	customer?: AdminOrderCustomer | null
	shippingAddress?: AdminOrderShippingAddress | null
	items?: AdminOrderItem[]
	pricing?: AdminOrderPricing | null
	timeline?: AdminOrderTimelineEvent[]
	auditTrail?: AdminOrderTimelineEvent[]
	notes?: AdminOrderNote[]
	notesInternal?: string | null
	notesCustomer?: string | null
	invoiceNumber?: string | null
	invoicePdfUrl?: string | null
}

export interface AdminOrdersSummary {
	total?: number
	pending?: number
	confirmed?: number
	processing?: number
	shipped?: number
	delivered?: number
	completed?: number
	cancelled?: number
	returned?: number
	refunded?: number
	failed?: number
	totalRevenue?: number
	revenue?: number
	currencyCode?: string
	totalOrders?: number
	returnsCount?: number
	inDeliveryCount?: number
}

export type PaginatedApiResponse<T> = Page<T> & {
	items?: T[]
	totalItems?: number
	page?: number
}

export interface ListAdminOrdersParams {
	page?: number
	size?: number
	sort?: string
	status?: OrderStatus
}

export type TransitionableOrderStatus = Exclude<OrderStatus, "PENDING">

export interface TransitionOrderStatusPayload {
	targetStatus: TransitionableOrderStatus
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
	notesInternal?: string | null
	notesCustomer?: string | null
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

// z.input keeps coerced fields (quantity) accepting strings from the DOM;
// z.output is the parsed payload sent to the backend.
export type EditOrderFormValues = z.input<typeof editOrderSchema>
export type EditOrderFormParsed = z.output<typeof editOrderSchema>
