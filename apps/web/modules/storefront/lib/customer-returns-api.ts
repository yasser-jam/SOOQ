/**
 * Customer returns — API layer for the published storefront's returns flow
 * (`app/published-store/[tenantId]/returns`, plus the "طلب إرجاع" action on the
 * order detail page).
 *
 * Same footing as `customer-orders-api.ts`: the *customer-facing*
 * `/customer/returns/**` endpoints, authenticated with the storefront
 * customer's `sooq-store-access-token` cookie and called through `api()` so the
 * Bearer header and the 401 refresh-and-retry keep working.
 *
 * Twin of `apps/store/lib/customer-orders-api.ts` & co — apps/store keeps its
 * own copy of this module; mirror changes there when the flow settles.
 */

import { api } from "@/lib/api"
import type { OrderStatus } from "@/lib/domain-enums"
import {
	buildPageParams,
	normalizePage,
	type NormalizedPage,
} from "@/lib/pagination"
import type { ApiResponse, Page } from "@/lib/types"

// ─── Item condition ───────────────────────────────────────────────────────────

export const RETURN_ITEM_CONDITIONS = [
	"OPENED",
	"UNOPENED",
	"USED",
	"DAMAGED",
] as const

export type ReturnItemCondition = (typeof RETURN_ITEM_CONDITIONS)[number]

export const RETURN_ITEM_CONDITION_LABELS: Record<ReturnItemCondition, string> = {
	OPENED: "مفتوح",
	UNOPENED: "غير مفتوح",
	USED: "مستعمل",
	DAMAGED: "تالف",
}

export const DEFAULT_RETURN_ITEM_CONDITION: ReturnItemCondition = "OPENED"

// ─── Eligibility ──────────────────────────────────────────────────────────────

/**
 * Statuses a return can be opened from. The backend stays the source of truth
 * (it rejects an illegal return with 4xx); this list only keeps the action from
 * showing up on an order that obviously can't be returned yet.
 */
const RETURNABLE_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
	"DELIVERED",
	"COMPLETED",
])

export const isOrderReturnable = (status?: OrderStatus | null): boolean =>
	Boolean(status) && RETURNABLE_ORDER_STATUSES.has(status as OrderStatus)

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Returns are listed unpaginated for now — one big page until the list screen
 * grows a proper pager (see `listCustomerReturns`).
 */
export const RETURNS_PAGE_SIZE = 1000

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateReturnItemPayload = {
	orderItemId: string
	quantity: number
	itemCondition: ReturnItemCondition
}

/** Body of `POST /customer/returns`. */
export type CreateReturnPayload = {
	orderId: string
	reason: string
	items: CreateReturnItemPayload[]
}

/**
 * TODO: the backend payloads for the list/detail endpoints aren't pinned down
 * yet — these stay permissive until the response structure lands, at which
 * point the returns list/detail screens get built on top of them.
 */
export type CustomerReturnListItem = Record<string, unknown>

export type CustomerReturn = Record<string, unknown>

// ─── Query keys ───────────────────────────────────────────────────────────────

export const customerReturnKeys = {
	all: ["customer-returns"] as const,
	list: (page: number, size: number) =>
		[...customerReturnKeys.all, "list", page, size] as const,
	detail: (returnRequestId: string) =>
		[...customerReturnKeys.all, "detail", returnRequestId] as const,
}

// ─── Calls ────────────────────────────────────────────────────────────────────

/** `POST /customer/returns` — opens a return request for part of an order. */
export const createCustomerReturn = async (
	payload: CreateReturnPayload,
): Promise<void> => {
	await api<ApiResponse<unknown>>("/customer/returns", {
		method: "POST",
		body: payload,
	})
}

export type ListCustomerReturnsParams = {
	page?: number
	size?: number
}

/** `GET /customer/returns?page&size` — newest first (backend-sorted). */
export const listCustomerReturns = async (
	params: ListCustomerReturnsParams = {},
): Promise<NormalizedPage<CustomerReturnListItem>> => {
	const size = params.size ?? RETURNS_PAGE_SIZE
	const response = await api<ApiResponse<Page<CustomerReturnListItem>>>(
		"/customer/returns",
		{ params: buildPageParams({ page: params.page ?? 0, size }) },
	)

	return normalizePage<CustomerReturnListItem>(response.data, size)
}

/** `GET /customer/returns/{returnRequestId}` — one return request. */
export const getCustomerReturn = async (
	returnRequestId: string,
): Promise<CustomerReturn> => {
	const response = await api<ApiResponse<CustomerReturn>>(
		`/customer/returns/${returnRequestId}`,
	)

	if (!response.data) {
		throw new Error("تعذّر العثور على طلب الإرجاع.")
	}

	return response.data
}
