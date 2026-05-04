import { NextRequest, NextResponse } from "next/server"

import { listMockAdminOrders } from "@/modules/order/order/apis/mock-service"
import type { ListAdminOrdersParams, OrderStatus } from "@/modules/order/order/types"

const ORDER_STATUSES: OrderStatus[] = [
	"PENDING",
	"CONFIRMED",
	"PROCESSING",
	"SHIPPED",
	"DELIVERED",
	"COMPLETED",
	"CANCELLED",
	"RETURNED",
	"REFUNDED",
	"FAILED",
]

const parseNumberParam = (value: string | null): number | undefined => {
	if (!value) return undefined

	const parsed = Number(value)

	return Number.isFinite(parsed) ? parsed : undefined
}

const parseStatusParam = (value: string | null): OrderStatus | undefined => {
	if (!value) return undefined

	return ORDER_STATUSES.includes(value as OrderStatus)
		? (value as OrderStatus)
		: undefined
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)

	const params: ListAdminOrdersParams = {
		page: parseNumberParam(searchParams.get("page")),
		size: parseNumberParam(searchParams.get("size")),
		sort: searchParams.get("sort") ?? undefined,
		status: parseStatusParam(searchParams.get("status")),
	}

	return NextResponse.json({
		data: listMockAdminOrders(params),
	})
}
