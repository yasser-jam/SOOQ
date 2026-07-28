/**
 * Customer order history — API layer for the `/store/[tenantId]/orders` pages.
 *
 * These are the *customer-facing* order endpoints (`/customer/orders/**`),
 * authenticated with the storefront customer's `sooq-store-access-token` cookie —
 * not the merchant `/admin/orders/**` endpoints used by apps/web. All calls go
 * through `api()` (aliased from apps/web) so the Bearer header, the 401
 * refresh-and-retry, and mock mode keep working.
 */

import cookiesConfig from "@/config/cookies-config"
import { api } from "@/lib/api"
import { getCookie } from "@/lib/cookies"
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/domain-enums"
import {
	buildPageParams,
	normalizePage,
	type NormalizedPage,
} from "@/lib/pagination"
import type { ApiResponse, Page } from "@/lib/types"

// ─── Types (mirrors of the backend payloads) ──────────────────────────────────

/** One row of `GET /customer/orders`. */
export type CustomerOrderListItem = {
	orderId: string
	tenantId?: string
	customerId?: string
	orderNumber?: string
	orderStatus?: OrderStatus
	paymentStatus?: PaymentStatus
	paymentMethod?: PaymentMethod
	subtotal?: number
	discountAmount?: number
	taxAmount?: number
	total?: number
	itemCount?: number
	placedAt?: string
}

export type CustomerOrderShippingAddress = {
	latitude?: number | null
	longitude?: number | null
	recipientName?: string | null
	phone?: string | null
	addressLabel?: string | null
}

export type CustomerOrderItem = {
	orderItemId?: string
	variantId?: string
	productTitle?: string
	variantTitle?: string
	sku?: string
	quantity?: number
	unitPrice?: number
	discountAmount?: number
	totalPrice?: number
}

export type CustomerOrderTimelineEntry = {
	timelineId?: string
	action?: string
	actor?: string
	details?: string | null
	createdAt?: string
}

/** Payload of `GET /customer/orders/{orderId}`. */
export type CustomerOrder = {
	orderId: string
	orderNumber?: string
	orderStatus?: OrderStatus
	paymentStatus?: PaymentStatus
	paymentMethod?: PaymentMethod
	currencyCode?: string
	subtotal?: number
	discountAmount?: number
	taxAmount?: number
	shippingCost?: number
	total?: number
	shippingAddress?: CustomerOrderShippingAddress | null
	notesCustomer?: string | null
	placedAt?: string
	items?: CustomerOrderItem[]
	timeline?: CustomerOrderTimelineEntry[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const ORDERS_PAGE_SIZE = 20

export const DEFAULT_ORDER_CURRENCY = "SYP"

/**
 * Statuses the order can no longer move out of — the cancel action is hidden
 * for these. The backend stays the source of truth (it rejects an illegal
 * cancel with 4xx); this list only keeps the button from being an obvious
 * no-op.
 */
const TERMINAL_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
	"DELIVERED",
	"COMPLETED",
	"CANCELLED",
	"RETURNED",
	"REFUNDED",
	"FAILED",
])

export const isOrderCancellable = (status?: OrderStatus | null): boolean =>
	Boolean(status) && !TERMINAL_ORDER_STATUSES.has(status as OrderStatus)

/** Arabic labels for the audit actions returned in `order.timeline[].action`. */
export const ORDER_TIMELINE_ACTION_LABELS: Record<string, string> = {
	ORDER_CREATED: "تم إنشاء الطلب",
	CONFIRMED: "تم تأكيد الطلب",
	PROCESSING: "بدأت معالجة الطلب",
	SHIPPED: "تم شحن الطلب",
	DELIVERED: "تم تسليم الطلب",
	COMPLETED: "تم إكمال الطلب",
	CANCELLED: "تم إلغاء الطلب",
	RETURNED: "تم إرجاع الطلب",
	REFUNDED: "تم استرداد المبلغ",
	FAILED: "فشل الطلب",
	NOTES_UPDATED: "تم تحديث الملاحظات",
	ORDER_EDITED: "تم تعديل الطلب",
	PAYMENT_CAPTURED: "تم استلام الدفعة",
}

export const ORDER_TIMELINE_ACTOR_LABELS: Record<string, string> = {
	CUSTOMER: "العميل",
	MERCHANT: "المتجر",
	ADMIN: "المتجر",
	SYSTEM: "النظام",
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const customerOrderKeys = {
	all: ["customer-orders"] as const,
	list: (page: number, size: number) =>
		[...customerOrderKeys.all, "list", page, size] as const,
	detail: (orderId: string) =>
		[...customerOrderKeys.all, "detail", orderId] as const,
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * The order pages live outside the Puck renderer, so they can't read auth from
 * `StoreProvider` — they check the same cookie the OTP flow writes.
 */
export const hasCustomerSession = (): boolean =>
	Boolean(getCookie(cookiesConfig.storeAccessToken))

// ─── Formatting ───────────────────────────────────────────────────────────────

export const formatOrderMoney = (
	amount?: number | null,
	currencyCode?: string | null,
): string => {
	if (typeof amount !== "number" || Number.isNaN(amount)) return ""

	const currency = currencyCode || DEFAULT_ORDER_CURRENCY

	try {
		return new Intl.NumberFormat("ar-SY", {
			style: "currency",
			currency,
			maximumFractionDigits: 0,
		}).format(amount)
	} catch {
		return `${amount} ${currency}`
	}
}

export const formatOrderDateTime = (value?: string | null): string => {
	if (!value) return ""

	const parsed = new Date(value)
	if (Number.isNaN(parsed.getTime())) return value

	return parsed.toLocaleString("en-GB", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	})
}

// ─── Calls ────────────────────────────────────────────────────────────────────

export type ListCustomerOrdersParams = {
	page?: number
	size?: number
}

/** `GET /customer/orders?page&size` — newest first (backend-sorted). */
export const listCustomerOrders = async (
	params: ListCustomerOrdersParams = {},
): Promise<NormalizedPage<CustomerOrderListItem>> => {
	const size = params.size ?? ORDERS_PAGE_SIZE
	const response = await api<ApiResponse<Page<CustomerOrderListItem>>>(
		"/customer/orders",
		{ params: buildPageParams({ page: params.page ?? 0, size }) },
	)

	return normalizePage<CustomerOrderListItem>(response.data, size)
}

/** `GET /customer/orders/{orderId}` — full order with items + timeline. */
export const getCustomerOrder = async (
	orderId: string,
): Promise<CustomerOrder> => {
	const response = await api<ApiResponse<CustomerOrder>>(
		`/customer/orders/${orderId}`,
	)

	if (!response.data) {
		throw new Error("تعذّر العثور على الطلب.")
	}

	return response.data
}

const INVOICE_EXTENSION_BY_MIME: Record<string, string> = {
	"application/pdf": "pdf",
	"text/html": "html",
	"text/csv": "csv",
	"application/json": "json",
}

/**
 * `GET /customer/orders/{orderId}/invoice` — returns the invoice file itself,
 * so it's fetched as a Blob and handed to the browser as a download. The
 * response headers (and therefore `Content-Disposition`) aren't reachable
 * through `api()`, so the filename is rebuilt from the order number.
 */
export const downloadOrderInvoice = async (
	orderId: string,
	orderNumber?: string | null,
): Promise<void> => {
	const blob = await api<Blob>(`/customer/orders/${orderId}/invoice`, {
		responseType: "blob",
	})

	const extension = INVOICE_EXTENSION_BY_MIME[blob.type] ?? "pdf"
	const url = URL.createObjectURL(blob)
	const link = document.createElement("a")
	link.href = url
	link.download = `invoice-${orderNumber || orderId}.${extension}`
	document.body.appendChild(link)
	link.click()
	link.remove()

	// Revoking synchronously can abort the download in some browsers.
	setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** `POST /customer/orders/{orderId}/cancel` — `reason` is optional. */
export const cancelCustomerOrder = async (
	orderId: string,
	reason?: string,
): Promise<void> => {
	const trimmed = reason?.trim()

	await api<ApiResponse<unknown>>(`/customer/orders/${orderId}/cancel`, {
		method: "POST",
		body: trimmed ? { reason: trimmed } : {},
	})
}
