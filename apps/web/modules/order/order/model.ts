import {
	ORDER_STATUS_META,
	PAYMENT_STATUS_META,
} from "@/lib/domain-enums"

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
